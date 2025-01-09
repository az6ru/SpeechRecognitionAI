import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mic } from "lucide-react";
import type { TranscriptionResponse } from "@/lib/types";
import { FileUpload } from "@/components/FileUpload";
import { TranscriptionResult } from "@/components/TranscriptionResult";
import { TranscriptionAnalysis } from "@/components/TranscriptionAnalysis";

export default function Home() {
  const [transcription, setTranscription] = useState<TranscriptionResponse | null>(null);
  const [transcriptionFileName, setTranscriptionFileName] = useState<string | undefined>();

  const handleTranscriptionComplete = (result: TranscriptionResponse, fileName: string) => {
    setTranscription(result);
    setTranscriptionFileName(fileName);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Mic className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Быстрый cервис распознавания речи
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Загрузите аудиофайл и получите точную транскрипцию с помощью Voice
            Converter
          </p>
        </div>

        {/* File Upload */}
        <Card>
          <CardContent className="pt-6">
            <FileUpload onTranscriptionComplete={handleTranscriptionComplete} />
          </CardContent>
        </Card>

        {/* Results */}
        {transcription && (
          <div className="space-y-8">
            {/* Transcription Results */}
            <TranscriptionResult 
              transcription={transcription} 
              fileName={transcriptionFileName} 
            />

            {/* Voice Convert AI Analysis */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Voice Convert AI
                </h2>
                <TranscriptionAnalysis text={transcription.transcript} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}