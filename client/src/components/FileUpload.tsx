import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { TranscriptionResponse, TranscriptionOptions } from "@/lib/types";
import TranscriptionOptionsForm from "./TranscriptionOptionsForm";
import AudioPlayer from "./AudioPlayer";

interface FileUploadProps {
  onTranscriptionComplete: (result: TranscriptionResponse) => void;
}

const DEFAULT_OPTIONS: TranscriptionOptions = {
  smart_format: true,
  punctuate: true,
  numerals: true
};

export function FileUpload({ onTranscriptionComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<TranscriptionOptions>(DEFAULT_OPTIONS);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const { toast } = useToast();

  const calculateCost = (duration: number) => {
    return Math.ceil(duration / 60); // 1 рубль за минуту
  };

  const handleFileSelection = (file: File) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(audio.duration);
      URL.revokeObjectURL(url);
    });

    audio.src = url;
    setSelectedFile(file);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    handleFileSelection(file);
  }, []);

  const handleTranscribe = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("audio", selectedFile);
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
  };

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

      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Выбранный файл: {selectedFile.name}
          </p>

          <AudioPlayer file={selectedFile} />

          {audioDuration && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Длительность: {Math.round(audioDuration)} секунд
              </p>
              <p className="text-sm text-gray-600">
                Стоимость: {calculateCost(audioDuration)} руб.
              </p>
            </div>
          )}

          <Button
            onClick={handleTranscribe}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isUploading ? "Обработка..." : "Транскрибировать"}
          </Button>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-gray-600 text-center">
            Обработка аудио...
          </p>
        </div>
      )}
    </div>
  );
}