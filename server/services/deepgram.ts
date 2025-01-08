import { createClient } from "@deepgram/sdk";
import type { PrerecordedTranscriptionResponse } from "@deepgram/sdk/dist/types";

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error("DEEPGRAM_API_KEY environment variable is required");
}

// Initialize the Deepgram SDK with the API key
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export async function transcribeAudio(audioBuffer: Buffer) {
  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
      smart_format: true,
      model: "general",
      language: "ru",
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      transcript: result.results?.channels[0]?.alternatives[0]?.transcript || "",
      confidence: result.results?.channels[0]?.alternatives[0]?.confidence,
    };
  } catch (error) {
    console.error("Deepgram API error:", error);
    throw error;
  }
}