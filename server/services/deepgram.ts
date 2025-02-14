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
      detect_language: options.detect_language ?? true,
      utterances: options.diarize === true // Enable utterances when diarization is requested
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
    if (options.diarize && alternative.words) {
      try {
        let currentSpeaker = -1;
        let currentText = '';

        // Group words by speaker
        for (const word of alternative.words) {
          if (word.speaker !== undefined) {
            if (currentSpeaker !== word.speaker && currentText) {
              // Save previous speaker's text when speaker changes
              if (currentSpeaker !== -1) {
                speakers.push({
                  speaker: currentSpeaker,
                  text: currentText.trim()
                });
              }
              currentText = '';
              currentSpeaker = word.speaker;
            }
            currentText += ' ' + word.word;
          }
        }

        // Don't forget to add the last speaker's text
        if (currentSpeaker !== -1 && currentText) {
          speakers.push({
            speaker: currentSpeaker,
            text: currentText.trim()
          });
        }

        console.log('Processed speakers:', speakers);
      } catch (error) {
        console.error('Error processing speakers:', error);
      }
    }

    // Обработка умного форматирования
    if (options.smart_format && alternative.paragraphs) {
      try {
        const paragraphGroups = Array.isArray(alternative.paragraphs) ? 
          alternative.paragraphs : 
          alternative.paragraphs.paragraphs || [];

        paragraphs = paragraphGroups.map((para: any) => {
          if (Array.isArray(para.sentences)) {
            return para.sentences.map((sentence: any) => sentence.text).join(' ');
          }
          return para.text || '';
        });

        console.log('Processed paragraphs:', paragraphs);
      } catch (error) {
        console.error('Error processing paragraphs:', error);
        paragraphs = [transcript];
      }
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