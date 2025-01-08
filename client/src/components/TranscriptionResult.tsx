import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import { TranscriptionResponse } from "../lib/types";

interface TranscriptionResultProps {
  transcription: TranscriptionResponse;
}

export default function TranscriptionResult({ transcription }: TranscriptionResultProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(transcription.transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        {transcription.paragraphs ? (
          // Если есть абзацы, отображаем их с отступами
          <div className="space-y-4">
            {transcription.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-gray-700">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          // Если абзацев нет, отображаем весь текст как есть
          <p className="text-gray-700 whitespace-pre-wrap">
            {transcription.transcript}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy text
            </>
          )}
        </Button>
      </div>

      {transcription.confidence && (
        <p className="text-sm text-gray-500">
          Confidence score: {Math.round(transcription.confidence * 100)}%
        </p>
      )}
    </div>
  );
}