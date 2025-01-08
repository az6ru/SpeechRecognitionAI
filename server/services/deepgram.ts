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
      smart_format: options.smart_format === true,
      punctuate: options.punctuate ?? true,
      numerals: options.numerals ?? true,
      detect_language: options.detect_language ?? true,
      diarize: options.diarize ?? false,
    };

    if (options.language && options.language !== 'auto') {
      deepgramOptions.detect_language = false;
      deepgramOptions.language = options.language;
    }

    console.log('Request to Deepgram API with options:', JSON.stringify(deepgramOptions, null, 2));

    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      deepgramOptions
    );

    if (!result) {
      throw new Error("Failed to get transcription result");
    }

    console.log('Full Deepgram API response:', JSON.stringify(result, null, 2));

    const channel = result.results?.channels[0];
    const alternative = channel?.alternatives[0];

    if (!alternative) {
      throw new Error("No transcription alternative found");
    }

    const transcript = alternative.transcript || "";
    const confidence = alternative.confidence;
    const detected_language = channel?.detected_language;
    const duration = result.metadata?.duration;

    // Извлекаем абзацы из слов с учетом пауз и пунктуации
    let paragraphs: string[] = [];

    if (options.smart_format && alternative.words) {
      let currentParagraph: string[] = [];
      let lastWordEnd = 0;

      alternative.words.forEach((word: any, index: number) => {
        // Проверяем паузу между словами (больше 1 секунды считаем новым параграфом)
        const pause = word.start - lastWordEnd;
        const isLongPause = pause > 1;

        // Используем punctuated_word для сохранения пунктуации
        const wordText = word.punctuated_word || word.word;

        // Если длинная пауза или предыдущее слово заканчивается на знак конца предложения
        if (isLongPause || (index > 0 && /[.!?]$/.test(currentParagraph[currentParagraph.length - 1]))) {
          if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join(' '));
            currentParagraph = [];
          }
        }

        currentParagraph.push(wordText);
        lastWordEnd = word.end;
      });

      // Добавляем последний параграф
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
      }

      console.log('Created paragraphs from words:', paragraphs);
    } else {
      // Если smart_format выключен, возвращаем весь текст как один параграф
      paragraphs = [transcript];
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
      paragraphs_count: paragraphs.length
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