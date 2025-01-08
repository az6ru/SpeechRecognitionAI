import { createClient } from "@deepgram/sdk";

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error("DEEPGRAM_API_KEY environment variable is required");
}

if (!process.env.DEEPGRAM_MODEL) {
  throw new Error("DEEPGRAM_MODEL environment variable is required");
}

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

interface TranscriptionOptions {
  smart_format?: boolean;
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
      model: process.env.DEEPGRAM_MODEL,
      smart_format: options.smart_format === true,
      punctuate: true, // Всегда включено
      numerals: true, // Всегда включено
      diarize: options.diarize ?? false,
    };

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
      const MIN_PAUSE_FOR_PARAGRAPH = 3; // Увеличили минимальную паузу до 3 секунд
      const MIN_WORDS_IN_PARAGRAPH = 20; // Увеличили минимальное количество слов в абзаце

      alternative.words.forEach((word: any, index: number) => {
        const pause = word.start - lastWordEnd;
        const wordText = word.punctuated_word || word.word;
        const isEndOfSentence = /[.!?]$/.test(wordText);
        const isLongPause = pause > MIN_PAUSE_FOR_PARAGRAPH;
        const isLastWord = index === alternative.words.length - 1;

        // Добавляем слово в текущий параграф
        currentParagraph.push(wordText);

        // Создаем новый параграф только если:
        // 1. Есть достаточное количество слов И
        // 2. Текущее предложение закончилось И
        // 3. (Есть значительная пауза ИЛИ это последнее слово)
        if (
          currentParagraph.length >= MIN_WORDS_IN_PARAGRAPH && 
          isEndOfSentence && 
          (isLongPause || isLastWord)
        ) {
          paragraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }

        lastWordEnd = word.end;
      });

      // Добавляем оставшиеся слова в последний параграф
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