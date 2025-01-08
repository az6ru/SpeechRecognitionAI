import { createClient } from "@deepgram/sdk";
import type { PrerecordedTranscriptionResponse } from "@deepgram/sdk/dist/types";

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error("DEEPGRAM_API_KEY environment variable is required");
}

// Initialize the Deepgram SDK with the API key
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

interface TranscriptionOptions {
  model: string;
  language?: string;
  detect_language?: boolean;
  smart_format?: boolean;
  punctuate?: boolean;
  numerals?: boolean;
}

export async function transcribeAudio(audioBuffer: Buffer, options: TranscriptionOptions) {
  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
      smart_format: options.smart_format,
      model: options.model,
      language: options.language,
      detect_language: options.detect_language,
      punctuate: options.punctuate,
      numerals: options.numerals,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      transcript: result.results?.channels[0]?.alternatives[0]?.transcript || "",
      confidence: result.results?.channels[0]?.alternatives[0]?.confidence,
      detected_language: result.results?.channels[0]?.detected_language,
    };
  } catch (error) {
    console.error("Deepgram API error:", error);
    throw error;
  }
}