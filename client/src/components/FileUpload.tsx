import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { TranscriptionOptions } from "@/lib/types";
import AudioPlayer from "./AudioPlayer";

interface FileUploadProps {
  onTranscriptionComplete: (result: any, fileName: string) => void;
}

const DEFAULT_OPTIONS: TranscriptionOptions = {
  smart_format: true,
  diarize: true
};

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

export function FileUpload({ onTranscriptionComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const { toast } = useToast();

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
    formData.append("options", JSON.stringify(DEFAULT_OPTIONS));

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
      onTranscriptionComplete(result, selectedFile.name);
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
    <div className="space-y-8">
      {/* Загрузка аудио */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Загрузка аудио</h3>

        <div
          {...getRootProps()}
          className={`border border-input rounded-lg p-8 text-center transition-colors bg-background
            ${isDragActive ? 'border-primary bg-primary/5' : isProcessingFile ? 'border-muted cursor-not-allowed opacity-50' : 'hover:border-primary'}`}
        >
          <input {...getInputProps()} />
          {isProcessingFile ? (
            <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
          ) : (
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
          )}
          <p className="mt-2 text-sm text-gray-600">
            {isProcessingFile
              ? "Обработка файла..."
              : isDragActive
              ? "Перетащите аудио файл сюда"
              : "Перетащите аудио файл или нажмите для выбора"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Поддерживаются форматы MP3, WAV, M4A, FLAC, OGG
          </p>
        </div>
      </div>

      {selectedFile && (
        <>
          {/* Проигрыватель и информация */}
          <div className="space-y-4 border rounded-lg p-4 bg-background">
            <AudioPlayer file={selectedFile} />

            {audioDuration && (
              <div className="space-y-2 text-sm text-gray-600">
                <p>Длительность: {formatDuration(audioDuration)}</p>
                <p>Стоимость: {calculateCost(audioDuration)} руб.</p>
              </div>
            )}
          </div>


          {/* Загрузка и прогресс */}
          {isUploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 text-center">
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
        </>
      )}
    </div>
  );
}