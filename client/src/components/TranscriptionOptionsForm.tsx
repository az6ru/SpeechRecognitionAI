import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type TranscriptionOptions } from "../lib/types";

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
        <div className="flex items-center justify-between">
          <div>
            <Label>Умное форматирование</Label>
            <p className="text-sm text-gray-500">
              Улучшает читаемость текста: добавляет абзацы, форматирует даты и числа
            </p>
          </div>
          <Switch 
            checked={options.smart_format}
            onCheckedChange={(checked) => handleChange("smart_format", checked)}
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
    </Card>
  );
}