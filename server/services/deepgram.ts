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

interface TranscriptionResult {
  transcript: string;
  confidence?: number;
  detected_language?: string;
  duration?: number;
}

export async function transcribeAudio(audioBuffer: Buffer, options: TranscriptionOptions): Promise<TranscriptionResult> {
  try {
    const deepgramOptions = {
      model: options.model,
      smart_format: options.smart_format,
      punctuate: options.punctuate,
      numerals: options.numerals,
      detect_language: options.detect_language,
    };

    // Если язык указан явно и это не auto, добавляем его в параметры
    if (options.language && options.language !== 'auto') {
      deepgramOptions.detect_language = false;
      deepgramOptions.language = options.language;
    }

    console.log('Deepgram API options:', JSON.stringify(deepgramOptions, null, 2));

    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      deepgramOptions
    );

    if (!result) {
      throw new Error("Failed to get transcription result");
    }

    // Логируем полный ответ от API
    console.log('Full Deepgram API response:', JSON.stringify(result, null, 2));

    const duration = result.metadata?.duration;
    const transcript = result.results?.channels[0]?.alternatives[0]?.transcript || "";
    const confidence = result.results?.channels[0]?.alternatives[0]?.confidence;
    const detected_language = result.results?.channels[0]?.detected_language;

    console.log('Transcription result:', {
      transcript: transcript.slice(0, 100) + '...',
      confidence,
      detected_language,
      duration,
      model: result.metadata?.model, // Добавляем информацию о использованной модели
      request_id: result.metadata?.request_id, // Добавляем ID запроса
      features_used: { // Добавляем информацию об использованных функциях
        smart_format: deepgramOptions.smart_format,
        punctuate: deepgramOptions.punctuate,
        numerals: deepgramOptions.numerals
      }
    });

    return {
      transcript,
      confidence,
      detected_language,
      duration,
    };
  } catch (error) {
    console.error("Deepgram API error:", error);
    throw error;
  }
}