import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import type { TranscriptionResponse } from "@/lib/types";
import { ExportButton } from "./ExportButton";

interface TranscriptionResultProps {
  transcription: TranscriptionResponse;
}

const SPEAKER_COLORS = [
  'border-blue-400 bg-blue-50',
  'border-green-400 bg-green-50',
  'border-purple-400 bg-purple-50',
  'border-orange-400 bg-orange-50',
  'border-pink-400 bg-pink-50',
];

export function TranscriptionResult({ transcription }: TranscriptionResultProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(transcription.transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!transcription.transcript) {
    return (
      <div className="bg-yellow-50 rounded-lg p-4">
        <p className="text-yellow-800">
          Нет текста для отображения. Возможно, произошла ошибка при транскрибации.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        {transcription.speakers && transcription.speakers.length > 0 ? (
          <div className="space-y-4">
            {transcription.speakers.map((speaker, index) => (
              <div 
                key={index} 
                className={`border-l-4 pl-4 p-3 rounded-r-lg ${SPEAKER_COLORS[index % SPEAKER_COLORS.length]}`}
              >
                <p className="font-semibold text-sm mb-2">
                  Спикер {speaker.speaker + 1}
                </p>
                <p className="text-gray-700">{speaker.text}</p>
              </div>
            ))}
          </div>
        ) : transcription.paragraphs && transcription.paragraphs.length > 0 ? (
          <div className="space-y-4">
            {transcription.paragraphs.map((paragraph: string, index: number) => (
              <p key={index} className="text-gray-700">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">
            {transcription.transcript}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Скопировано
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Копировать текст
            </>
          )}
        </Button>
        <ExportButton transcription={transcription} />
      </div>
    </div>
  );
}