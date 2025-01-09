import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TranscriptionResponse } from "@/lib/types";
import { ExportButton } from "./ExportButton";

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
            Копировать текст
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
    <Card className="border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-medium text-gray-900">
          Результат транскрипции
        </CardTitle>
        <ActionButtons onCopy={copyToClipboard} copied={copied} transcription={transcription} />
      </CardHeader>
      <CardContent className="pt-0">
        <Card className="border bg-gray-50">
          <CardContent className="pt-4">
            {transcription.speakers && transcription.speakers.length > 0 ? (
              <div className="space-y-4">
                {transcription.speakers.map((speaker) => (
                  <div
                    key={`${speaker.speaker}-${speaker.text.substring(0, 20)}`}
                    className="space-y-1"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      Спикер {speaker.speaker + 1}
                    </p>
                    <p className="text-sm leading-relaxed text-gray-600">
                      {speaker.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : transcription.paragraphs && transcription.paragraphs.length > 0 ? (
              <div className="space-y-4">
                {transcription.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-sm leading-relaxed text-gray-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-gray-600">
                {transcription.transcript}
              </p>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}