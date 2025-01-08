export interface TranscriptionOptions {
  model: string;
  language?: string;
  detect_language?: boolean;
  smart_format?: boolean;
  punctuate?: boolean;
  numerals?: boolean;
  diarize?: boolean;
}

export interface TranscriptionResponse {
  transcript: string;
  confidence?: number;
  detected_language?: string;
  duration?: number;
  error?: string;
  paragraphs?: string[]; // Добавляем поддержку абзацев
}

export const AVAILABLE_MODELS = [
  { value: "nova", label: "Nova (Fastest)" },
  { value: "nova-2", label: "Nova-2 (Most accurate)" },
  { value: "nova-2-general", label: "Nova-2 General (Balanced)" },
] as const;

export const AVAILABLE_LANGUAGES = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "auto", label: "Автоопределение" },
] as const;