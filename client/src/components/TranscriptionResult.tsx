import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import type { TranscriptionResponse } from "@/lib/types";
import { ExportButton } from "./ExportButton";
import { cn } from "@/lib/utils";

interface TranscriptionResultProps {
  transcription: TranscriptionResponse;
}

interface ActionButtonsProps {
  onCopy: () => void;
  copied: boolean;
  transcription: TranscriptionResponse;
}

const SPEAKER_COLORS = [
  'bg-blue-50/50 border-blue-200 text-blue-900',
  'bg-emerald-50/50 border-emerald-200 text-emerald-900',
  'bg-purple-50/50 border-purple-200 text-purple-900',
  'bg-orange-50/50 border-orange-200 text-orange-900',
  'bg-pink-50/50 border-pink-200 text-pink-900',
  'bg-cyan-50/50 border-cyan-200 text-cyan-900',
  'bg-red-50/50 border-red-200 text-red-900',
  'bg-amber-50/50 border-amber-200 text-amber-900',
];

function ActionButtons({ onCopy, copied, transcription }: ActionButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onCopy}
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
  );
}

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
      <div className="bg-destructive/10 rounded-lg p-4">
        <p className="text-destructive font-medium">
          Нет текста для отображения. Возможно, произошла ошибка при транскрибации.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold tracking-tight">Результат транскрипции</h2>
        <ActionButtons onCopy={copyToClipboard} copied={copied} transcription={transcription} />
      </div>

      <div className="bg-muted/50 rounded-lg p-6 shadow-sm border prose-custom max-w-none">
        {transcription.speakers && transcription.speakers.length > 0 ? (
          <div className="space-y-4">
            {transcription.speakers.map((speaker) => (
              <div 
                key={`${speaker.speaker}-${speaker.text.substring(0, 20)}`}
                className={cn(
                  "relative border rounded-lg p-4 shadow-sm transition-colors duration-200",
                  SPEAKER_COLORS[speaker.speaker % SPEAKER_COLORS.length]
                )}
              >
                <div className="font-medium mb-2 flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full bg-background shadow-sm text-sm font-semibold",
                    "text-foreground"
                  )}>
                    {speaker.speaker + 1}
                  </span>
                  <span className="text-sm">Спикер {speaker.speaker + 1}</span>
                </div>
                <p className="leading-7 [&:not(:first-child)]:mt-6">{speaker.text}</p>
              </div>
            ))}
          </div>
        ) : transcription.paragraphs && transcription.paragraphs.length > 0 ? (
          <div className="space-y-4">
            {transcription.paragraphs.map((paragraph, index) => (
              <p key={index} className="leading-7 [&:not(:first-child)]:mt-6">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p className="leading-7 [&:not(:first-child)]:mt-6">
            {transcription.transcript}
          </p>
        )}
      </div>
    </div>
  );
}