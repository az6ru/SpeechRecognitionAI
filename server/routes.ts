import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { transcribeAudio } from "./services/deepgram";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export function registerRoutes(app: Express): Server {
  app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const result = await transcribeAudio(req.file.buffer);
      res.json(result);
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({
        error: "Failed to transcribe audio",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}