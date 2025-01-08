import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUpload from "../components/FileUpload";
import TranscriptionResult from "../components/TranscriptionResult";
import { Mic } from "lucide-react";
import { type TranscriptionResponse } from "../lib/types";

export default function Home() {
  const [transcription, setTranscription] = useState<TranscriptionResponse | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Mic className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Speech Recognition Service
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Upload your audio file and get accurate transcription powered by Deepgram
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Audio</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload onTranscriptionComplete={setTranscription} />
          </CardContent>
        </Card>

        {transcription && (
          <Card>
            <CardHeader>
              <CardTitle>Transcription Result</CardTitle>
            </CardHeader>
            <CardContent>
              <TranscriptionResult transcription={transcription} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
