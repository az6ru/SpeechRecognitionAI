import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { transcribeAudio } from "./services/deepgram.js";
import pdf from 'html-pdf';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
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
  // Обработка ошибок для production
  const handleError = (error: any, res: any) => {
    console.error("Operation error:", error);
    const isProd = process.env.NODE_ENV === 'production';
    const message = isProd ? 'Internal Server Error' : error.message;
    res.status(500).json({ error: message });
  };

  app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
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
      res.json(result);
    } catch (error: any) {
      handleError(error, res);
    }
  });

  // Оптимизированная конфигурация для PDF экспорта
  app.post("/api/export-pdf", async (req, res) => {
    try {
      const { html } = req.body;
      if (!html) {
        return res.status(400).json({ error: "HTML content is required" });
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
        encoding: 'UTF-8',
        timeout: 30000,
        phantomPath: process.env.NODE_ENV === 'production' 
          ? path.join(__dirname, '..', 'node_modules', 'phantomjs-prebuilt', 'bin', 'phantomjs')
          : undefined,
      };

      // Add error handling for PDF generation
      pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) {
          console.error("PDF Generation Error:", err);
          return handleError(new Error("Failed to generate PDF"), res);
        }

        try {
          // Set proper headers for PDF download
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=transcription.pdf');
          res.setHeader('Cache-Control', 'no-cache');
          res.send(buffer);
        } catch (error) {
          console.error("Error sending PDF:", error);
          handleError(error, res);
        }
      });
    } catch (error) {
      console.error("PDF Export Error:", error);
      handleError(error, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}