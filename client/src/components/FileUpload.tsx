import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { TranscriptionResponse, TranscriptionOptions } from "../lib/types";
import TranscriptionOptionsForm from "@/components/TranscriptionOptionsForm";

interface FileUploadProps {
  onTranscriptionComplete: (result: TranscriptionResponse) => void;
}

const DEFAULT_OPTIONS: TranscriptionOptions = {
  model: "nova-2",
  smart_format: true,
  punctuate: true,
  numerals: true,
  detect_language: true
};

export default function FileUpload({ onTranscriptionComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<TranscriptionOptions>(DEFAULT_OPTIONS);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("audio", file);
    formData.append("options", JSON.stringify(options));

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      onTranscriptionComplete(result);
      toast({
        title: "Успех",
        description: "Аудио успешно транскрибировано",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось транскрибировать аудио файл",
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [onTranscriptionComplete, toast, options]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg']
    },
    maxFiles: 1
  });

  return (
    <div className="space-y-6">
      <TranscriptionOptionsForm options={options} onChange={setOptions} />

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? "Перетащите аудио файл сюда"
            : "Перетащите аудио файл или нажмите для выбора"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Поддерживаются форматы MP3, WAV, M4A, FLAC, OGG
        </p>
      </div>

      {isUploading && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Обработка аудио...</span>
          </div>
          <Progress value={progress} />
        </div>
      )}
    </div>
  );
}