import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Edit2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TranscriptionResponse } from "@/lib/types";
import { ExportButton } from "./ExportButton";

interface TranscriptionResultProps {
  transcription: TranscriptionResponse;
  fileName?: string;
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

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export function TranscriptionResult({ transcription, fileName }: TranscriptionResultProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(fileName?.replace(/\.[^/.]+$/, "") || "Новая транскрипция");

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="max-w-md"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(false)}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium text-gray-900">{title}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <ActionButtons onCopy={copyToClipboard} copied={copied} transcription={transcription} />
      </div>

      {/* Метаданные транскрипции */}
      <Card className="border bg-gray-50">
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Длительность аудио</p>
              <p className="font-medium">{transcription.duration ? formatDuration(transcription.duration) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Точность распознавания</p>
              <p className="font-medium">{transcription.confidence ? `${Math.round(transcription.confidence * 100)}%` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Язык</p>
              <p className="font-medium">{transcription.detected_language || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border bg-gray-50">
        <CardContent className="pt-6">
          {transcription.speakers && transcription.speakers.length > 0 ? (
            <div className="space-y-6">
              {transcription.speakers.map((speaker) => (
                <div
                  key={`${speaker.speaker}-${speaker.text.substring(0, 20)}`}
                  className="space-y-2"
                >
                  <p className="text-sm font-bold text-gray-900">
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
    </div>
  );
}