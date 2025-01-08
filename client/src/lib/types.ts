export interface TranscriptionOptions {
  model: string;
  language?: string;
  detect_language?: boolean;
  smart_format?: boolean;
  punctuate?: boolean;
  numerals?: boolean;
}

export interface TranscriptionResponse {
  transcript: string;
  confidence?: number;
  detected_language?: string;
  error?: string;
}

export const AVAILABLE_MODELS = [
  { value: "nova-2", label: "Nova-2 (Fastest)" },
  { value: "enhanced", label: "Enhanced (High accuracy)" },
  { value: "whisper", label: "Whisper (Best for non-English)" },
] as const;

export const AVAILABLE_LANGUAGES = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "auto", label: "Автоопределение" },
] as const;