import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mic } from "lucide-react";
import type { TranscriptionResponse } from "@/lib/types";
import { FileUpload } from "@/components/FileUpload";
import { TranscriptionResult } from "@/components/TranscriptionResult";

export default function Home() {
  const [transcription, setTranscription] =
    useState<TranscriptionResponse | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Mic className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Voice Converter — cервис распознавания речи
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Загрузите аудиофайл и получите точную транскрипцию с помощью Voice
            Converter
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <FileUpload onTranscriptionComplete={setTranscription} />
          </CardContent>
        </Card>

        {transcription && (
          <Card>
            <CardContent className="pt-6">
              <TranscriptionResult transcription={transcription} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
