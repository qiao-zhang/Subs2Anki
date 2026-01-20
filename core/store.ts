import {create} from 'zustand';
import {SubtitleLine, AnkiCard, AnkiNoteType, ProcessingState} from './types';

// Default constants
const DEFAULT_NOTE_TYPE: AnkiNoteType = {
  id: 123456789,
  name: "Subs2Anki",
  css: `.card { font-family:Arial; font-size:36px; text-align: center; color:black; background-color:white; } .before{ font-size: 18px; text-align: left; color: grey; } .after { font-size: 18px; text-align: left; color: grey; } .tags { font-size:15px; text-align: left; color:grey; } .notes { font-size:21px; text-align: left; color:grey; } .media > img { max-height: 270px; }`,
  fields: [
    {name: "Sequence", source: 'Sequence'},
    {name: "Before"},
    {name: "BeforeAudio"},
    {name: "CurrentFront", source: 'Text'},
    {name: "CurrentBack", source: 'Furigana'},
    {name: "Audio", source: 'Audio'},
    {name: "After"},
    {name: "AfterAudio"},
    {name: "Meaning", source: 'Translation'},
    {name: "Media", source: 'Image'},
    {name: "Notes", source: 'Notes'}
  ],
  templates: [{
    Name: "Card 1",
    Front: `{{#Tags}}<div class="tags"><span>🏷️</span> {{Tags}}</div>{{/Tags}}<span class='media'>{{Media}}</span></br>{{#Before}}<div class="before"><span>⬅️</span> {{furigana:Before}}<span id="before-audio">{{BeforeAudio}}</span></div>{{/Before}}<div class='expression'>{{furigana:CurrentFront}}</div>{{#After}}<div class="after"><span>➡️</span> {{furigana:After}}</div>{{/After}}<script>var title = document.getElementById("before-audio"); if (title) { var button = title.querySelector(".replay-button.soundLink"); if (button) button.click(); }</script>`,
    Back: `{{#Tags}}<div class="tags"><span>🏷️</span> {{Tags}}</div>{{/Tags}}<span class='media'>{{Media}}</span></br>{{#Before}}<div class="before"><span>⬅️</span> {{furigana:Before}}<span id="before-audio">{{BeforeAudio}}</span></div>{{/Before}}<div class='reading'>{{furigana:CurrentBack}}<span id="current-audio">{{Audio}}</span></div><div class='meaning'>{{Meaning}}</div>{{#After}}<div class="after"><span>➡️</span> {{furigana:After}}<span id="after-audio">{{AfterAudio}}</span></div>{{/After}}<br><div class='notes'>{{Notes}}</div><script>var title = document.getElementById("current-audio"); if (title) { var button = title.querySelector(".replay-button.soundLink"); if (button) button.click(); }</script>`
  }]
};

interface AppState {
  // Video Data
  videoSrc: string;
  videoName: string;
  videoFile: File | null; // Added: Raw file object for FFmpeg
  setVideo: (file: File) => void; // Changed: Takes File object

  // Subtitles
  subtitleLines: SubtitleLine[];
  subtitleFileName: string;
  fileHandle: any | null;
  hasUnsavedChanges: boolean;
  setSubtitles: (lines: SubtitleLine[], fileName: string, fileHandle?: any) => void;
  updateSubtitleText: (id: number, text: string) => void;
  updateSubtitleTime: (id: number, start: number, end: number) => void;
  toggleSubtitleLock: (id: number) => void;
  addSubtitle: (sub: SubtitleLine) => void;
  removeSubtitle: (id: number) => void;
  shiftSubtitles: (offset: number) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;

  // Anki Cards
  ankiCards: AnkiCard[];
  ankiConfig: AnkiNoteType;
  processing: ProcessingState;
  addCard: (card: AnkiCard) => void;
  updateCard: (id: string, updates: Partial<AnkiCard>) => void;
  deleteCard: (id: string) => void;
  setAnkiConfig: (config: AnkiNoteType) => void;

  // Anki Connect
  ankiConnectUrl: string;
  setAnkiConnectUrl: (url: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Video defaults
  videoSrc: '',
  videoName: '',
  videoFile: null,
  setVideo: (file) => {
    const src = URL.createObjectURL(file);
    set({videoSrc: src, videoName: file.name, videoFile: file});
  },

  // Subtitle defaults
  subtitleLines: [],
  subtitleFileName: '',
  fileHandle: null,
  hasUnsavedChanges: false,
  setSubtitles: (lines, fileName, fileHandle = null) =>
    set({subtitleLines: lines, subtitleFileName: fileName, fileHandle, hasUnsavedChanges: false}),

  updateSubtitleText: (id, text) => set((state) => ({
    subtitleLines: state.subtitleLines.map(s => (s.id === id && !s.locked) ? {...s, text} : s),
    hasUnsavedChanges: true
  })),

  updateSubtitleTime: (id, start, end) => set((state) => ({
    subtitleLines: state.subtitleLines.map(s => (s.id === id && !s.locked) ? {
      ...s,
      startTime: start,
      endTime: end
    } : s),
    hasUnsavedChanges: true
  })),

  toggleSubtitleLock: (id) => set((state) => ({
    subtitleLines: state.subtitleLines.map(s => s.id === id ? {...s, locked: !s.locked} : s)
  })),

  addSubtitle: (sub) => set((state) => ({
    subtitleLines: [...state.subtitleLines, sub].sort((a, b) => a.startTime - b.startTime),
    hasUnsavedChanges: true
  })),

  removeSubtitle: (id) => set((state) => ({
    subtitleLines: state.subtitleLines.filter(s => s.id !== id),
    hasUnsavedChanges: true
  })),

  // Shift all subtitles by offset. Applies to locked files too to maintain relative sync with video.
  shiftSubtitles: (offset) => set((state) => ({
    subtitleLines: state.subtitleLines.map(s => ({
      ...s,
      startTime: Math.max(0, s.startTime + offset),
      endTime: Math.max(0, s.endTime + offset)
    })),
    hasUnsavedChanges: true
  })),

  setHasUnsavedChanges: (val) => set({hasUnsavedChanges: val}),

  // Anki defaults
  ankiCards: [],
  ankiConfig: DEFAULT_NOTE_TYPE,
  processing: {isAnalyzing: false, progress: 0, total: 0},
  addCard: (card) => set((state) => ({ankiCards: [card, ...state.ankiCards]})),
  updateCard: (id, updates) => set((state) => ({
    ankiCards: state.ankiCards.map(c => c.id === id ? {...c, ...updates} : c)
  })),
  deleteCard: (id) => set((state) => ({ankiCards: state.ankiCards.filter(c => c.id !== id)})),
  setAnkiConfig: (config) => set({ankiConfig: config}),

  // Anki Connect
  ankiConnectUrl: localStorage.getItem('sub2anki_anki_url') || 'http://127.0.0.1:8765',
  setAnkiConnectUrl: (url) => {
    localStorage.setItem('sub2anki_anki_url', url);
    set({ankiConnectUrl: url});
  }
}));
