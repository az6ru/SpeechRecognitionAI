import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import type { TranscriptionResponse } from "@/lib/types";
import { ExportButton } from "./ExportButton";

interface TranscriptionResultProps {
  transcription: TranscriptionResponse;
}

const SPEAKER_COLORS = [
  'border-blue-600 bg-blue-50/80 text-blue-900',
  'border-emerald-600 bg-emerald-50/80 text-emerald-900',
  'border-purple-600 bg-purple-50/80 text-purple-900',
  'border-orange-600 bg-orange-50/80 text-orange-900',
  'border-pink-600 bg-pink-50/80 text-pink-900',
  'border-cyan-600 bg-cyan-50/80 text-cyan-900',
  'border-red-600 bg-red-50/80 text-red-900',
  'border-amber-600 bg-amber-50/80 text-amber-900',
];

export function TranscriptionResult({ transcription }: TranscriptionResultProps) {
  const [copied, setCopied] = useState(false);

  const formatText = () => {
    if (transcription.speakers && transcription.speakers.length > 0) {
      return transcription.speakers
        .map(speaker => `Спикер ${speaker.speaker + 1}:\n${speaker.text}`)
        .join('\n\n');
    }
    if (transcription.paragraphs && transcription.paragraphs.length > 0) {
      return transcription.paragraphs.join('\n\n');
    }
    return transcription.transcript;
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(formatText());
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
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        {transcription.speakers && transcription.speakers.length > 0 ? (
          <div className="space-y-4">
            {transcription.speakers.map((speaker, index) => (
              <div 
                key={index}
                className={`relative border-l-4 pl-4 p-4 rounded-lg shadow-sm 
                  transition-colors duration-200 hover:shadow-md 
                  ${SPEAKER_COLORS[index % SPEAKER_COLORS.length]}`}
              >
                <div className="font-medium mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-sm text-sm font-semibold">
                    {speaker.speaker + 1}
                  </span>
                  <span className="text-sm">Спикер {speaker.speaker + 1}</span>
                </div>
                <p className="leading-relaxed">{speaker.text}</p>
              </div>
            ))}
          </div>
        ) : transcription.paragraphs && transcription.paragraphs.length > 0 ? (
          <div className="space-y-4">
            {transcription.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
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