import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AVAILABLE_MODELS, AVAILABLE_LANGUAGES, type TranscriptionOptions } from "../lib/types";

interface TranscriptionOptionsProps {
  options: TranscriptionOptions;
  onChange: (options: TranscriptionOptions) => void;
}

export default function TranscriptionOptionsForm({ options, onChange }: TranscriptionOptionsProps) {
  const handleChange = (key: keyof TranscriptionOptions, value: any) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Модель</Label>
          <Select value={options.model} onValueChange={(value) => handleChange("model", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Язык</Label>
          <Select 
            value={options.language || "auto"} 
            onValueChange={(value) => {
              handleChange("language", value === "auto" ? undefined : value);
              handleChange("detect_language", value === "auto");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Умное форматирование</Label>
              <p className="text-sm text-gray-500">Улучшает читаемость, добавляя знаки препинания и форматирование</p>
            </div>
            <Switch 
              checked={options.smart_format}
              onCheckedChange={(checked) => handleChange("smart_format", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Распознавание говорящих</Label>
              <p className="text-sm text-gray-500">Определяет смену говорящих в диалоге</p>
            </div>
            <Switch 
              checked={options.diarize}
              onCheckedChange={(checked) => handleChange("diarize", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Пунктуация</Label>
              <p className="text-sm text-gray-500">Добавляет знаки препинания</p>
            </div>
            <Switch 
              checked={options.punctuate}
              onCheckedChange={(checked) => handleChange("punctuate", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Преобразование чисел</Label>
              <p className="text-sm text-gray-500">Конвертирует числа из цифр в текст</p>
            </div>
            <Switch 
              checked={options.numerals}
              onCheckedChange={(checked) => handleChange("numerals", checked)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}