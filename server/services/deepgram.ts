import { createClient } from "@deepgram/sdk";
import type { PrerecordedTranscriptionResponse } from "@deepgram/sdk/dist/types";

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error("DEEPGRAM_API_KEY environment variable is required");
}

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
    // Преобразуем опции в формат, который ожидает Deepgram API
    const deepgramOptions: any = {
      model: options.model,
      smart_format: options.smart_format,
      punctuate: options.punctuate,
      numerals: options.numerals,
    };

    // Добавляем language только если он указан явно
    if (options.language && options.language !== 'auto') {
      deepgramOptions.language = options.language;
    }

    // Добавляем detect_language только если язык не указан явно
    if (!options.language || options.language === 'auto') {
      deepgramOptions.detect_language = true;
    }

    console.log('Deepgram API options:', deepgramOptions);

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      deepgramOptions
    );

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