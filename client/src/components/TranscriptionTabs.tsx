import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TranscriptionResponse } from "@/lib/types";

interface TranscriptionTabsProps {
  transcription: TranscriptionResponse;
  onTabChange?: (value: string) => void;
}

export function TranscriptionTabs({ transcription, onTabChange }: TranscriptionTabsProps) {
  return (
    <Tabs defaultValue="raw" className="w-full" onValueChange={onTabChange}>
      <TabsList className="w-full">
        <TabsTrigger value="raw" className="flex-1">Транскрипция</TabsTrigger>
        <TabsTrigger value="formatted" className="flex-1">Умное форматирование</TabsTrigger>
        <TabsTrigger value="speakers" className="flex-1">Спикеры</TabsTrigger>
      </TabsList>

      <TabsContent value="raw">
        <div className="pt-4">
          <p className="text-sm leading-relaxed text-gray-600">
            {transcription.transcript}
          </p>
        </div>
      </TabsContent>

      <TabsContent value="formatted">
        <div className="pt-4 space-y-4">
          {transcription.paragraphs?.map((paragraph, index) => (
            <p key={index} className="text-sm leading-relaxed text-gray-600">
              {paragraph}
            </p>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="speakers">
        <div className="pt-4 space-y-6">
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
    </Tabs>
  );
}