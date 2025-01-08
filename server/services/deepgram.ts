import { createClient } from "@deepgram/sdk";

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error("DEEPGRAM_API_KEY environment variable is required");
}

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

interface TranscriptionOptions {
  smart_format?: boolean;
  diarize?: boolean;
  model?: string;
  language?: string;
  detect_language?: boolean;
}

interface TranscriptionResult {
  transcript: string;
  confidence?: number;
  detected_language?: string;
  duration?: number;
  paragraphs?: string[];
  speakers?: { speaker: number; text: string }[];
}

export async function transcribeAudio(audioBuffer: Buffer, options: TranscriptionOptions): Promise<TranscriptionResult> {
  try {
    const deepgramOptions = {
      smart_format: options.smart_format === true,
      punctuate: true,
      numerals: true,
      diarize: options.diarize === true,
      model: options.model || 'nova-2',
      language: options.language || 'ru',
      detect_language: options.detect_language ?? true
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
    let speakers: { speaker: number; text: string }[] = [];

    // Обработка диаризации, если включена
    if (options.diarize && alternative.paragraphs) {
      // Группировка по спикерам
      alternative.paragraphs.forEach((para: any) => {
        if (para.speaker !== undefined && para.sentences) {
          const speakerText = para.sentences
            .map((sentence: any) => sentence.text)
            .join(' ');
          speakers.push({
            speaker: para.speaker,
            text: speakerText
          });
        }
      });
    }

    // Обработка умного форматирования
    if (options.smart_format && alternative.paragraphs) {
      paragraphs = alternative.paragraphs.map((para: any) => {
        return para.sentences
          .map((sentence: any) => sentence.text)
          .join(' ');
      });
    } else {
      paragraphs = [transcript];
    }

    const transcriptionResult = {
      transcript,
      confidence,
      detected_language,
      duration,
      paragraphs,
      ...(speakers.length > 0 && { speakers })
    };

    console.log('Final transcription result:', {
      transcript_length: transcript.length,
      confidence,
      detected_language,
      duration,
      paragraphs_count: paragraphs.length,
      speakers_count: speakers.length
    });

    return transcriptionResult;
  } catch (error) {
    console.error("Deepgram API error:", error);
    throw error;
  }
}