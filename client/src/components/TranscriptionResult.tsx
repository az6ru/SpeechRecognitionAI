import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Edit2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { TranscriptionResponse } from "@/lib/types";
import { ExportButton } from "./ExportButton";
import { TranscriptionTabs } from "./TranscriptionTabs";
import { TranscriptionAnalysis } from "./TranscriptionAnalysis";
import { Card, CardContent } from "@/components/ui/card";

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
      {/* Voice Convert AI Analysis */}
      <TranscriptionAnalysis text={getActiveText()} />

      {/* Transcription Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Результат транскрипции
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Точность распознавания: {transcription.confidence ? `${Math.round(transcription.confidence * 100)}%` : 'N/A'}</span>
              <span>Язык: {transcription.detected_language || 'N/A'}</span>
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

        <div className="mb-4">
          {isEditing ? (
            <div className="flex items-center gap-2">
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

        <TranscriptionTabs 
          transcription={transcription} 
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
}