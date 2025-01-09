import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TranscriptionOptions } from "@/lib/types";
import TranscriptionOptionsForm from "./TranscriptionOptionsForm";
import AudioPlayer from "./AudioPlayer";

interface FileUploadProps {
  onTranscriptionComplete: (result: any) => void;
}

const DEFAULT_OPTIONS: TranscriptionOptions = {
  smart_format: true,
  punctuate: true,
  numerals: true
};

export function FileUpload({ onTranscriptionComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [options, setOptions] = useState<TranscriptionOptions>(DEFAULT_OPTIONS);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const { toast } = useToast();

  // Эффект для симуляции прогресса загрузки
  useEffect(() => {
    if (isUploading && uploadProgress < 90) {
      const timer = setTimeout(() => {
        setUploadProgress((prev) => {
          const increment = Math.random() * 10;
          return Math.min(prev + increment, 90);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isUploading, uploadProgress]);

  const calculateCost = (duration: number) => {
    return Math.ceil(duration / 60);
  };

  const handleFileSelection = async (file: File) => {
    setIsProcessingFile(true);
    try {
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => {
          setAudioDuration(audio.duration);
          URL.revokeObjectURL(url);
          resolve(null);
        });
        audio.addEventListener('error', reject);
        audio.src = url;
      });

      setSelectedFile(file);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить аудио файл",
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    handleFileSelection(file);
  }, []);

  const handleTranscribe = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

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

      setUploadProgress(100);
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
      setUploadProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg']
    },
    maxFiles: 1,
    disabled: isProcessingFile
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Загрузка аудио</h3>
        <TranscriptionOptionsForm options={options} onChange={setOptions} />
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors bg-white
          ${isDragActive ? 'border-primary bg-primary/5' : isProcessingFile ? 'border-muted cursor-not-allowed opacity-50' : 'border-muted hover:border-primary'}`}
      >
        <input {...getInputProps()} />
        {isProcessingFile ? (
          <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
        ) : (
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {isProcessingFile
            ? "Обработка файла..."
            : isDragActive
            ? "Перетащите аудио файл сюда"
            : "Перетащите аудио файл или нажмите для выбора"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Поддерживаются форматы MP3, WAV, M4A, FLAC, OGG
        </p>
      </div>

      {selectedFile && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Выбранный файл: {selectedFile.name}
          </p>

          <AudioPlayer file={selectedFile} />

          {audioDuration && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Длительность: {Math.round(audioDuration)} секунд
              </p>
              <p className="text-sm text-muted-foreground">
                Стоимость: {calculateCost(audioDuration)} руб.
              </p>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {uploadProgress < 100 ? "Загрузка и обработка файла..." : "Завершение..."}
              </p>
            </div>
          )}

          <Button
            onClick={handleTranscribe}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isUploading ? "Обработка..." : "Транскрибировать"}
          </Button>
        </div>
      )}
    </div>
  );
}