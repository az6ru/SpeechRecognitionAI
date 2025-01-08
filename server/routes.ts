import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { transcribeAudio } from "./services/deepgram";

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
  app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      // Базовые опции по умолчанию
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
            ...defaultOptions,  // Сначала дефолтные значения
            ...parsedOptions    // Затем пользовательские, которые перезапишут дефолтные
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
      console.error("Transcription error:", error);
      res.status(500).json({
        error: error.message || "Failed to transcribe audio",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}