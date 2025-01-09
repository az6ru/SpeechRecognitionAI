import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { TranscriptionResponse, TranscriptionOptions } from "@/lib/types";
import TranscriptionOptionsForm from "./TranscriptionOptionsForm";
import AudioPlayer from "./AudioPlayer";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [options, setOptions] = useState<TranscriptionOptions>(DEFAULT_OPTIONS);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const { toast } = useToast();

  const calculateCost = (duration: number) => {
    return Math.ceil(duration / 60); // 1 рубль за минуту
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
      <TranscriptionOptionsForm options={options} onChange={setOptions} />

      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : isProcessingFile ? 'border-gray-300 cursor-not-allowed opacity-50' : 'border-gray-300 hover:border-primary'}
          `}
        >
          <input {...getInputProps()} />
          <AnimatePresence mode="wait">
            {isProcessingFile ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
              </motion.div>
            )}
          </AnimatePresence>
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
      </motion.div>

      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50 rounded-lg p-4 space-y-4"
          >
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
              {isUploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isUploading ? "Обработка..." : "Транскрибировать"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}