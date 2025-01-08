import { Deepgram } from "@deepgram/sdk";
import type { PrerecordedTranscriptionResponse } from "@deepgram/sdk/dist/types";

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error("DEEPGRAM_API_KEY environment variable is required");
}

const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

export async function transcribeAudio(audioBuffer: Buffer) {
  try {
    const response: PrerecordedTranscriptionResponse = await deepgram.transcription.preRecorded(
      {
        buffer: audioBuffer,
        mimetype: 'audio/wav',
      },
      {
        smart_format: true,
        model: 'general',
        language: 'ru',
      }
    );

    return {
      transcript: response.results?.channels[0]?.alternatives[0]?.transcript || '',
      confidence: response.results?.channels[0]?.alternatives[0]?.confidence,
    };
  } catch (error) {
    console.error("Deepgram API error:", error);
    throw error;
  }
}