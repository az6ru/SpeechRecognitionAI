import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Edit2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TranscriptionResponse } from "@/lib/types";
import { ExportButton } from "./ExportButton";
import { TranscriptionAnalysis } from "./TranscriptionAnalysis";
import { TranscriptionTabs } from "./TranscriptionTabs";

interface TranscriptionResultProps {
  transcription: TranscriptionResponse;
  fileName?: string;
}

interface ActionButtonsProps {
  onCopy: () => void;
  copied: boolean;
  transcription: TranscriptionResponse;
  title: string;
}

function ActionButtons({ onCopy, copied, transcription, title }: ActionButtonsProps) {
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
      <ExportButton transcription={transcription} title={title} />
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
      {/* Заголовок и кнопки */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">
          Результат транскрипции
        </h2>
        <ActionButtons 
          onCopy={copyToClipboard} 
          copied={copied} 
          transcription={transcription} 
          title={title} 
        />
      </div>

      {/* Название файла с редактированием */}
      <div className="flex items-center gap-2">
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
            <p className="text-lg text-gray-700">{title}</p>
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

      {/* AI Analysis */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Voice Convert AI
          </h3>
          <TranscriptionAnalysis text={transcription.transcript} />
        </CardContent>
      </Card>

      {/* Transcription Tabs */}
      <Card>
        <CardContent className="pt-6">
          <TranscriptionTabs transcription={transcription} />
        </CardContent>
      </Card>
    </div>
  );
}