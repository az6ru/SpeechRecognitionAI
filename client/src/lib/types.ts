export interface TranscriptionResponse {
  transcript: string;
  confidence?: number;
  error?: string;
}
