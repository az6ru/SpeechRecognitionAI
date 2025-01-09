import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { transcribeAudio } from "./services/deepgram.js";
import { processTranscription } from "./services/ai-processing.js";
import pdf from 'html-pdf';
import { setupAuth } from "./auth.js";
import { db } from "@db";
import { usageRecords } from "@db/schema";
import { canTranscribeFile, recordUsage } from "./services/subscription.js";
import { eq, desc } from "drizzle-orm";

const GUEST_DURATION_LIMIT = 10; // 10 минут для гостей
const AUTH_FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB для авторизованных пользователей

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: AUTH_FILE_SIZE_LIMIT,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Get user's transcription history
  app.get("/api/history", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const history = await db.query.usageRecords.findMany({
        where: eq(usageRecords.userId, req.user.id),
        orderBy: desc(usageRecords.createdAt),
      });

      res.json(history);
    } catch (error: any) {
      console.error("Error fetching history:", error);
      res.status(500).json({ error: error.message || "Failed to fetch history" });
    }
  });

  app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Файл не был загружен" });
      }

      const fileSizeMB = req.file.size / (1024 * 1024);
      const estimatedDuration = fileSizeMB; // Грубая оценка длительности в минутах (1MB ≈ 1 минута)

      // Проверка длительности для гостей
      if (!req.isAuthenticated() && estimatedDuration > GUEST_DURATION_LIMIT) {
        return res.status(403).json({
          error: `Длительность файла превышает лимит для гостя (${GUEST_DURATION_LIMIT} минут). Зарегистрируйтесь, чтобы транскрибировать файлы большей длительности.`,
          isGuest: true
        });
      }

      // Проверка лимитов для авторизованных пользователей
      if (req.isAuthenticated()) {
        const canTranscribe = await canTranscribeFile(req.user.id, estimatedDuration);
        if (!canTranscribe) {
          return res.status(403).json({
            error: "Превышен месячный лимит. Обновите подписку, чтобы продолжить."
          });
        }
      }

      const defaultOptions = {
        model: "nova-2",
        smart_format: true,
        punctuate: true,
        numerals: true,
        detect_language: true
      };

      let options = { ...defaultOptions };

      try {
        if (req.body.options) {
          const parsedOptions = JSON.parse(req.body.options);
          options = {
            ...defaultOptions,
            ...parsedOptions
          };
        }
      } catch (e) {
        console.warn("Failed to parse transcription options:", e);
        console.warn("Using default options");
      }

      console.log('Processing request with options:', JSON.stringify(options, null, 2));
      const result = await transcribeAudio(req.file.buffer, options);

      // Сохраняем использование только для авторизованных пользователей
      if (req.isAuthenticated()) {
        await recordUsage(
          req.user.id,
          fileSizeMB,
          result.duration || estimatedDuration,
          result.id
        );
      }

      // Добавляем флаг isGuest в ответ
      res.json({
        ...result,
        isGuest: !req.isAuthenticated()
      });
    } catch (error: any) {
      console.error("Transcription error:", error);
      res.status(500).json({
        error: error.message || "Не удалось транскрибировать аудио файл",
        isGuest: !req.isAuthenticated()
      });
    }
  });

  // AI processing endpoint
  app.post("/api/process-transcription", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Требуется авторизация" });
      }

      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Необходим текст для обработки" });
      }

      const result = await processTranscription(text);
      res.json(result);
    } catch (error: any) {
      console.error("AI Processing error:", error);
      res.status(500).json({
        error: error.message || "Не удалось обработать транскрипцию",
      });
    }
  });

  // PDF export endpoint
  app.post("/api/export-pdf", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Требуется авторизация" });
      }

      const { html } = req.body;
      if (!html) {
        return res.status(400).json({ error: "Необходим HTML контент" });
      }

      const options = {
        format: 'A4',
        border: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px"
        },
        header: {
          height: "15mm"
        },
        footer: {
          height: "10mm"
        },
        encoding: 'UTF-8'
      };

      pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) {
          console.error("PDF generation error:", err);
          return res.status(500).json({ error: "Не удалось сгенерировать PDF" });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=transcription.pdf');
        res.send(buffer);
      });
    } catch (error) {
      console.error("PDF export error:", error);
      res.status(500).json({ error: "Не удалось сгенерировать PDF" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}