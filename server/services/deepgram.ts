import { createClient } from "@deepgram/sdk";

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error("DEEPGRAM_API_KEY environment variable is required");
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
      smart_format: options.smart_format === true,
      punctuate: true,
      numerals: true,
      diarize: options.diarize ?? false,
      language: 'ru', // добавляем поддержку русского языка
      model: 'general' // используем базовую модель, доступную по умолчанию
    };

    console.log('Request to Deepgram API with options:', JSON.stringify(deepgramOptions, null, 2));

    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      deepgramOptions
    );

    console.log('Raw Deepgram response:', JSON.stringify(result, null, 2));

    if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error("Invalid response format from Deepgram API");
    }

    const channel = result.results.channels[0];
    const alternative = channel.alternatives[0];

    if (!alternative.transcript) {
      throw new Error("No transcript in Deepgram response");
    }

    const transcript = alternative.transcript;
    const confidence = alternative.confidence;
    const detected_language = channel.detected_language;
    const duration = result.metadata?.duration;

    let paragraphs: string[] = [];

    if (options.smart_format && alternative.words) {
      let currentParagraph: string[] = [];
      let lastWordEnd = 0;
      const MIN_PAUSE_FOR_PARAGRAPH = 1.5;
      const MIN_WORDS_IN_PARAGRAPH = 10;

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

      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
      }

      console.log('Created paragraphs:', paragraphs.length);
    } else {
      paragraphs = [transcript];
    }

    const transcriptionResult = {
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

    return transcriptionResult;
  } catch (error) {
    console.error("Deepgram API error:", error);
    throw error;
  }
}