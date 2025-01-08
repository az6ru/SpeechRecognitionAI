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

    const response = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      deepgramOptions
    );

    console.log('Raw Deepgram response:', JSON.stringify(response, null, 2));

    if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error("Invalid response format from Deepgram API");
    }

    const channel = response.results.channels[0];
    const alternative = channel.alternatives[0];

    if (!alternative.transcript) {
      throw new Error("No transcript in Deepgram response");
    }

    const transcript = alternative.transcript;
    const confidence = alternative.confidence;
    const detected_language = channel.detected_language;
    const duration = response.metadata?.duration;

    // Извлекаем абзацы из слов с учетом пауз и пунктуации
    let paragraphs: string[] = [];

    if (options.smart_format && alternative.words) {
      let currentParagraph: string[] = [];
      let lastWordEnd = 0;
      const MIN_PAUSE_FOR_PARAGRAPH = 1.5; // Уменьшили паузу до 1.5 секунд
      const MIN_WORDS_IN_PARAGRAPH = 10; // Уменьшили минимальное количество слов

      alternative.words.forEach((word: any, index: number) => {
        const pause = word.start - lastWordEnd;
        const wordText = word.punctuated_word || word.word;
        const isEndOfSentence = /[.!?]$/.test(wordText);
        const isLongPause = pause > MIN_PAUSE_FOR_PARAGRAPH;
        const isLastWord = index === alternative.words.length - 1;

        currentParagraph.push(wordText);

        if (
          currentParagraph.length >= MIN_WORDS_IN_PARAGRAPH && 
          (isEndOfSentence && isLongPause || isLastWord)
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

      console.log('Created paragraphs:', paragraphs.length);
    } else {
      paragraphs = [transcript];
    }

    const result = {
      transcript,
      confidence,
      detected_language,
      duration,
      paragraphs
    };

    console.log('Final transcription result:', {
      transcript_length: transcript.length,
      confidence,
      detected_language,
      duration,
      paragraphs_count: paragraphs.length
    });

    return result;
  } catch (error) {
    console.error("Deepgram API error:", error);
    throw error;
  }
}