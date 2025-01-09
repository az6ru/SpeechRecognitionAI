import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [options, setOptions] = useState<TranscriptionOptions>(DEFAULT_OPTIONS);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isLoadingDuration, setIsLoadingDuration] = useState(false);
  const { toast } = useToast();

  const calculateCost = (duration: number) => {
    return Math.ceil(duration / 60); // 1 рубль за минуту
  };

  const handleFileSelection = async (file: File) => {
    setIsLoadingDuration(true);
    setAudioDuration(null);
    setUploadProgress(0);

    try {
      const url = URL.createObjectURL(file);
      const duration = await new Promise<number>((resolve, reject) => {
        const audio = new Audio();
        audio.addEventListener('loadedmetadata', () => {
          resolve(audio.duration);
        });
        audio.addEventListener('error', (e) => {
          reject(new Error(`Failed to load audio file: ${e.currentTarget?.error?.message || 'Unknown error'}`));
        });
        audio.src = url;
      });

      setAudioDuration(duration);
      setSelectedFile(file);
    } catch (error) {
      console.error('Error loading audio file:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось определить длительность аудио файла"
      });
    } finally {
      setIsLoadingDuration(false);
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
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      const response = await new Promise((resolve, reject) => {
        xhr.open('POST', '/api/transcribe');
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error('Ошибка сети'));
        xhr.responseType = 'json';
        xhr.send(formData);
      });

      onTranscriptionComplete(response as TranscriptionResponse);
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
    maxFiles: 1
  });

  return (
    <div className="space-y-6 font-sans antialiased">
      <TranscriptionOptionsForm options={options} onChange={setOptions} />

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-base font-medium text-muted-foreground">
          {isDragActive
            ? "Перетащите аудио файл сюда"
            : "Перетащите аудио файл или нажмите для выбора"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground/60">
          Поддерживаются форматы MP3, WAV, M4A, FLAC, OGG
        </p>
      </div>

      {selectedFile && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Выбранный файл: <span className="text-muted-foreground">{selectedFile.name}</span>
              </p>
            </div>

            <AudioPlayer file={selectedFile} />

            {isLoadingDuration ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm">Определение длительности...</p>
              </div>
            ) : audioDuration ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Длительность: {Math.round(audioDuration)} секунд
                </p>
                <p className="text-sm font-medium">
                  Стоимость: {calculateCost(audioDuration)} руб.
                </p>
              </div>
            ) : null}

            {isUploading && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p className="text-sm">Загрузка файла: {uploadProgress}%</p>
                </div>
                <Progress value={uploadProgress} className="h-2 w-full" />
              </div>
            )}

            <Button
              onClick={handleTranscribe}
              disabled={isUploading || isLoadingDuration}
              className="w-full"
            >
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? "Обработка..." : "Транскрибировать"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}