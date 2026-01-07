/**
 * Represents a single subtitle line parsed from a file.
 */
export interface Subtitle {
  id: number;
  startTime: number; // Start time in seconds
  endTime: number;   // End time in seconds
  text: string;      // The actual dialogue text
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
  screenshotDataUrl: string | null; // Base64 encoded image of the video frame
  audioBlob: Blob | null;   // Reserved for future audio clip support
  timestampStr: string;     // Formatted timestamp string for display (e.g., "01:23")
}

/**
 * Tracks the state of AI processing operations.
 */
export interface ProcessingState {
  isAnalyzing: boolean; // Whether an AI request is currently in flight
  progress: number;     // Current progress percentage (if batch processing)
  total: number;        // Total items to process
}