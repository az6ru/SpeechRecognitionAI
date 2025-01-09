import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Edit2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { TranscriptionResponse } from "@/lib/types";
import { ExportButton } from "./ExportButton";
import { TranscriptionTabs } from "./TranscriptionTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TranscriptionResultProps {
  transcription: TranscriptionResponse;
  fileName?: string;
}

interface ActionButtonsProps {
  onCopy: () => void;
  copied: boolean;
  transcription: TranscriptionResponse;
  title: string;
  activeTab: string;
}

function ActionButtons({ onCopy, copied, transcription, title, activeTab }: ActionButtonsProps) {
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
            Скопировать текст
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Копировать текст
          </>
        )}
      </Button>
      <ExportButton transcription={transcription} title={title} activeTab={activeTab} />
    </div>
  );
}

export function TranscriptionResult({ transcription, fileName }: TranscriptionResultProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(fileName?.replace(/\.[^/.]+$/, "") || "Новая транскрипция");
  const [activeTab, setActiveTab] = useState("raw");

  const getActiveText = () => {
    switch (activeTab) {
      case "formatted":
        return transcription.paragraphs?.join('\n\n') || transcription.transcript;
      case "speakers":
        return transcription.speakers
          ?.map(speaker => `Спикер ${speaker.speaker + 1}:\n${speaker.text}`)
          .join('\n\n') || transcription.transcript;
      default:
        return transcription.transcript;
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(getActiveText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!transcription.transcript) {
    return (
      <div className="bg-destructive/10 p-4 rounded-lg">
        <p className="text-destructive font-medium">
          Нет текста для отображения. Возможно, произошла ошибка при транскрибации.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Результат транскрипции</CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  Точность: {transcription.confidence ? `${Math.round(transcription.confidence * 100)}%` : 'N/A'}
                </Badge>
                <Badge variant="secondary">
                  Язык: {transcription.detected_language || 'N/A'}
                </Badge>
              </div>
            </div>
            <ActionButtons 
              onCopy={copyToClipboard} 
              copied={copied} 
              transcription={transcription} 
              title={title}
              activeTab={activeTab}
            />
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-2">
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
            <div className="flex items-center gap-2 mt-2">
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
        </CardHeader>
        <CardContent>
          <TranscriptionTabs 
            transcription={transcription} 
            onTabChange={setActiveTab}
          />
        </CardContent>
      </Card>
      {/* Voice Convert AI Analysis */}
      <TranscriptionAnalysis text={getActiveText()} />
    </div>
  );
}