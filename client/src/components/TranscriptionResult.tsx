import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Edit2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { TranscriptionResponse } from "@/lib/types";
import { ExportButton } from "./ExportButton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            Скопировано
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Копировать
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
  const [title, setTitle] = useState(fileName?.replace(/\.[^/.]+$/, "") || "Новая транскрибация");
  const [activeTab, setActiveTab] = useState("raw");

  const getActiveText = () => {
    switch (activeTab) {
      case "formatted":
        return transcription.paragraphs?.join('\n\n') || transcription.transcript;
      case "speakers":
        return transcription.speakers
          ?.map(speaker => `Спикер ${speaker.speaker + 1}:\n${speaker.text}`)
          .join('\n\n');
      default:
        return transcription.transcript;
    }
  };

  const copyToClipboard = async () => {
    const textToCopy = getActiveText();
    await navigator.clipboard.writeText(textToCopy);
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
    <Card>
      <CardHeader>
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
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-2">
            <Badge variant="secondary">
              Точность: {transcription.confidence ? `${Math.round(transcription.confidence * 100)}%` : 'N/A'}
            </Badge>
            <Badge variant="secondary">
              Язык: {transcription.detected_language || 'N/A'}
            </Badge>
          </div>
          <ActionButtons 
            onCopy={copyToClipboard} 
            copied={copied} 
            transcription={transcription} 
            title={title}
            activeTab={activeTab}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="raw" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="raw" className="flex-1">Транскрипция</TabsTrigger>
            <TabsTrigger value="formatted" className="flex-1">Умное форматирование</TabsTrigger>
            <TabsTrigger value="speakers" className="flex-1">Спикеры</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[500px] rounded-md border p-4">
            <TabsContent value="raw">
              <p className="text-sm leading-relaxed text-gray-600">
                {transcription.transcript}
              </p>
            </TabsContent>
            <TabsContent value="formatted">
              <div className="space-y-4">
                {transcription.paragraphs?.map((paragraph, index) => (
                  <p key={index} className="text-sm leading-relaxed text-gray-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="speakers">
              <div className="space-y-6">
                {transcription.speakers?.map((speaker) => (
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
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}