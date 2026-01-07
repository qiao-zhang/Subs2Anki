export interface Subtitle {
  id: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

export interface AnkiCard {
  id: string;
  subtitleId: number;
  text: string;
  translation: string;
  notes: string;
  screenshotDataUrl: string | null;
  audioBlob: Blob | null; 
  timestampStr: string;
}

export interface ProcessingState {
  isAnalyzing: boolean;
  progress: number;
  total: number;
}