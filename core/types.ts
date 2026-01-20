/**
 * Represents a single subtitle line parsed from a file.
 */
export interface SubtitleLine {
  id: number;
  startTime: number; // Start time in seconds
  endTime: number;   // End time in seconds
  text: string;      // The actual dialogue text
  locked?: boolean;  // Whether the subtitle is locked for editing
}

/**
 * Represents a Flashcard to be exported to Anki.
 */
export interface AnkiCard {
  id: string;               // Unique internal ID (UUID)
  subtitleId: number;       // Reference to the source subtitle
  text: string;             // The front text of the card
  translation: string;      // AI-generated translation
  notes: string;            // AI-generated notes (grammar, culture, vocab)
  furigana?: string;        // Generated ruby text

  // Media References (UUIDs pointing to IndexedDB)
  screenshotRef: string | null;
  audioRef: string | null;

  timestampStr: string;     // Formatted timestamp string for display (e.g., "01:23")
  audioStatus?: 'pending' | 'processing' | 'done' | 'error'; // Tracking background audio extraction

  // Sync status
  syncStatus?: 'unsynced' | 'syncing' | 'synced';       // Whether the card has been synced to Anki
}

/**
 * Tracks the state of AI processing operations.
 */
export interface ProcessingState {
  isAnalyzing: boolean; // Whether an AI request is currently in flight
  progress: number;     // Current progress percentage (if batch processing)
  total: number;        // Total items to process
}

/**
 * Available data sources that can be mapped to Anki fields.
 */
export type AnkiFieldSource = 'Text' | 'Translation' | 'Notes' | 'Image' | 'Audio' | 'Time' | 'Sequence' | 'Furigana';

/**
 * Anki Note Type Definition
 */
export interface AnkiField {
  name: string;
  source?: AnkiFieldSource; // The data source mapped to this field
}

export interface AnkiCardTemplate {
  Name: string;
  Front: string;
  Back: string;
}

export interface AnkiNoteType {
  id: number;
  name: string;
  css: string;
  fields: AnkiField[];
  templates: AnkiCardTemplate[];
}
