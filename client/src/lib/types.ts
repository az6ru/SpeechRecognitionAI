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
  { value: "general", label: "General (Balanced)" },
  { value: "base", label: "Base (Fastest)" },
  { value: "enhanced", label: "Enhanced (Most accurate)" },
] as const;

export const AVAILABLE_LANGUAGES = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "auto", label: "Автоопределение" },
] as const;