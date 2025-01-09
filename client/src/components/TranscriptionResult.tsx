import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className="bg-destructive/10">
        <CardContent className="pt-6">
          <p className="text-destructive font-medium">
            Нет текста для отображения. Возможно, произошла ошибка при транскрибации.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Результат транскрипции
        </CardTitle>
        <ActionButtons onCopy={copyToClipboard} copied={copied} transcription={transcription} />
      </CardHeader>
      <CardContent className="prose-custom max-w-none pt-0">
        {transcription.speakers && transcription.speakers.length > 0 ? (
          <div className="space-y-4">
            {transcription.speakers.map((speaker) => (
              <Card
                key={`${speaker.speaker}-${speaker.text.substring(0, 20)}`}
                className={cn(
                  "border shadow-sm transition-colors duration-200"
                )}
              >
                <CardContent className="pt-6">
                  <div className="font-medium mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {speaker.speaker + 1}
                    </span>
                    <span className="text-sm">Спикер {speaker.speaker + 1}</span>
                  </div>
                  <p className="leading-7 text-muted-foreground">{speaker.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : transcription.paragraphs && transcription.paragraphs.length > 0 ? (
          <div className="space-y-4">
            {transcription.paragraphs.map((paragraph, index) => (
              <p key={index} className="leading-7 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p className="leading-7 text-muted-foreground">
            {transcription.transcript}
          </p>
        )}
      </CardContent>
    </Card>
  );
}