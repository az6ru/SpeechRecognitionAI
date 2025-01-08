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
  diarize?: boolean;
}

interface TranscriptionResult {
  transcript: string;
  confidence?: number;
  detected_language?: string;
  duration?: number;
  paragraphs?: string[];
}

export async function transcribeAudio(audioBuffer: Buffer, options: TranscriptionOptions): Promise<TranscriptionResult> {
  try {
    const deepgramOptions = {
      model: options.model,
      smart_format: options.smart_format === true, // Явно преобразуем в boolean
      punctuate: options.punctuate ?? true,
      numerals: options.numerals ?? true,
      detect_language: options.detect_language ?? true,
      diarize: options.diarize ?? false,
    };

    // Если язык указан явно и это не auto, добавляем его в параметры
    if (options.language && options.language !== 'auto') {
      deepgramOptions.detect_language = false;
      deepgramOptions.language = options.language;
    }

    // Логируем параметры запроса
    console.log('Request to Deepgram API with options:', JSON.stringify(deepgramOptions, null, 2));

    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      deepgramOptions
    );

    if (!result) {
      throw new Error("Failed to get transcription result");
    }

    // Логируем полный ответ от API для отладки
    console.log('Full Deepgram API response:', JSON.stringify(result, null, 2));

    const transcript = result.results?.channels[0]?.alternatives[0]?.transcript || "";
    const confidence = result.results?.channels[0]?.alternatives[0]?.confidence;
    const detected_language = result.results?.channels[0]?.detected_language;
    const duration = result.metadata?.duration;

    // Извлекаем абзацы, если включено умное форматирование
    let paragraphs: string[] | undefined;
    if (options.smart_format) {
      const paragraphsData = result.results?.channels[0]?.alternatives[0]?.paragraphs?.paragraphs;
      if (paragraphsData && Array.isArray(paragraphsData)) {
        paragraphs = paragraphsData.map(p => p.text);
        console.log('Extracted paragraphs:', paragraphs);
      } else {
        console.log('No paragraphs found in response:', paragraphsData);
        // Если абзацы не найдены, разбиваем текст по точкам
        paragraphs = transcript.split(/(?<=[.!?])\s+/).filter(p => p.trim());
      }
    }

    // Логируем обработанный результат
    console.log('Processed transcription result:', {
      transcript: transcript.slice(0, 100) + '...',
      confidence,
      detected_language,
      duration,
      model: result.metadata?.model,
      request_id: result.metadata?.request_id,
      features_used: {
        smart_format: deepgramOptions.smart_format,
        punctuate: deepgramOptions.punctuate,
        numerals: deepgramOptions.numerals,
        diarize: deepgramOptions.diarize
      },
      paragraphs_count: paragraphs?.length
    });

    return {
      transcript,
      confidence,
      detected_language,
      duration,
      paragraphs
    };
  } catch (error) {
    console.error("Deepgram API error:", error);
    throw error;
  }
}