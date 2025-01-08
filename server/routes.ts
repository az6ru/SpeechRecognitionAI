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
    // Accept only audio files
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

      let options = {
        model: "enhanced",
        smart_format: true,
        punctuate: true,
        numerals: true,
        detect_language: true
      };

      try {
        if (req.body.options) {
          options = JSON.parse(req.body.options);
        }
      } catch (e) {
        console.warn("Failed to parse transcription options, using defaults");
      }

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