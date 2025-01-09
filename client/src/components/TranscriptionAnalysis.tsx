import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TranscriptionAnalysisProps {
  text: string;
}

interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  topics: Array<{ topic: string; importance: number }>;
}

export function TranscriptionAnalysis({ text }: TranscriptionAnalysisProps) {
  const { toast } = useToast();

  const { mutate: analyzeTranscription, isLoading, data: analysis } = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/process-transcription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Не удалось выполнить анализ");
      }

      return response.json() as Promise<AnalysisResult>;
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось выполнить анализ транскрипции",
      });
    },
  });

  if (!analysis && !isLoading) {
    return (
      <div className="mt-4">
        <Button onClick={() => analyzeTranscription()}>
          Анализировать транскрипцию
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">
          Анализ транскрипции...
        </span>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Voice Convert AI
        </h3>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="summary" className="flex-1">Краткое содержание</TabsTrigger>
            <TabsTrigger value="key-points" className="flex-1">Ключевые моменты</TabsTrigger>
            <TabsTrigger value="topics" className="flex-1">Основные темы</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="pt-4">
              <p className="text-sm text-gray-600">{analysis.summary}</p>
            </div>
          </TabsContent>

          <TabsContent value="key-points">
            <div className="pt-4">
              <ul className="list-disc list-inside space-y-1">
                {analysis.keyPoints.map((point, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="topics">
            <div className="pt-4 space-y-2">
              {analysis.topics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">{topic.topic}</span>
                  <div className="flex items-center">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(topic.importance / 10) * 100}%` }}
                      />
                    </div>
                    <span className="ml-2 text-xs text-gray-500">
                      {topic.importance}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}