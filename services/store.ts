import {create} from 'zustand';
import {AnkiCard, AnkiNoteType, ProcessingState, SubtitleLine} from './types.ts';
import {UndoRedoManager} from './undo-redo-service.ts';

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
    {name: "Notes", source: 'Notes'},
  ],
  templates: [{
    Name: "Card 1",
    Front: `{{#Tags}}<div class="tags"><span>🏷️</span> {{Tags}}</div>{{/Tags}}<span class='media'>{{Media}}</span></br>{{#Before}}<div class="before"><span>⬅️</span> {{furigana:Before}}<span id="before-audio">{{BeforeAudio}}</span></div>{{/Before}}<div class='expression'>{{furigana:CurrentFront}}</div>{{#After}}<div class="after"><span>➡️</span> {{furigana:After}}</div>{{/After}}<script>var title = document.getElementById("before-audio"); if (title) { var button = title.querySelector(".replay-button.soundLink"); if (button) button.click(); }</script>`,
    Back: `{{#Tags}}<div class="tags"><span>🏷️</span> {{Tags}}</div>{{/Tags}}<span class='media'>{{Media}}</span></br>{{#Before}}<div class="before"><span>⬅️</span> {{furigana:Before}}<span id="before-audio">{{BeforeAudio}}</span></div>{{/Before}}<div class='reading'>{{furigana:CurrentBack}}<span id="current-audio">{{Audio}}</span></div><div class='meaning'>{{Meaning}}</div>{{#After}}<div class="after"><span>➡️</span> {{furigana:After}}<span id="after-audio">{{AfterAudio}}</span></div>{{/After}}<br><div class='notes'>{{Notes}}</div><script>var title = document.getElementById("current-audio"); if (title) { var button = title.querySelector(".replay-button.soundLink"); if (button) button.click(); }</script>`
  }]
};

interface AppState {
  // Project Name
  projectName: string; // 新增：项目名称
  setProjectName: (name: string) => void; // 新增：设置项目名称

  // Video Data
  videoSrc: string;
  videoName: string;
  videoFile: File | null; // Added: Raw file object for FFmpeg
  setVideo: (file: File) => void; // Changed: Takes File object
  resetVideo: () => void;

  // Subtitles
  subtitleLines: SubtitleLine[];
  subtitleFileName: string;
  fileHandle: any | null;
  hasUnsavedChanges: boolean;
  setSubtitles: (lines: SubtitleLine[], fileName: string, fileHandle?: any) => void;
  updateSubtitleText: (id: number, text: string) => void;
  updateSubtitleTime: (id: number, start: number, end: number) => void;
  toggleSubtitleLineStatus: (id: number) => void;
  setSubtitleLineStatus: (id: number, status: 'normal' | 'locked' | 'ignored') => void;
  addSubtitleLine: (sub: SubtitleLine) => void;
  getSubtitleLine: (id: number) => SubtitleLine | null;
  removeSubtitle: (id: number) => void;
  shiftSubtitles: (offset: number) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  mergeSubtitleLines: (ids: number[]) => void;
  breakUpSubtitleLine: (id: number) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Anki Cards
  ankiCards: AnkiCard[];
  processing: ProcessingState;
  addCard: (card: AnkiCard) => void;
  updateCardSyncStatus: (id: string, status: 'unsynced' | 'syncing' | 'synced') => void;
  updateCardAudioStatus: (id: string, status: 'pending' | 'processing' | 'done' | 'error', audioRef?: string) => void;
  deleteCard: (id: string) => void;
  clearCards: () => void;
  ankiConfig: AnkiNoteType;
  setAnkiConfig: (config: AnkiNoteType) => void;

  // Anki Connect
  ankiConnectUrl: string;
  setAnkiConnectUrl: (url: string) => void;

  // Settings
  bulkCreateLimit: number;
  setBulkCreateLimit: (limit: number) => void;
  autoDeleteSynced: boolean;
  setAutoDeleteSynced: (enabled: boolean) => void;
  showBulkCreateButton: boolean;
  setShowBulkCreateButton: (show: boolean) => void;
  audioVolume: number;
  setAudioVolume: (volume: number) => void;
}

// 创建全局的 undo/redo 管理器实例
const globalUndoRedoManager = new UndoRedoManager();

export const useAppStore = create<AppState>((set, get) => ({
  projectName: '', // 默认项目名称为空
  setProjectName: (name) => set({ projectName: name }),

  // Video defaults
  videoSrc: '',
  videoName: '',
  videoFile: null,
  resetVideo: () => {
    set({
      videoSrc: '',
      videoName: '',
      videoFile: null
    });
  },
  setVideo: (file) => {
    const src = URL.createObjectURL(file);
    // 当设置视频时，如果项目名称为空，则使用视频文件名作为默认项目名称
    const currentProjectName = get().projectName;
    set({
      videoSrc: src,
      videoName: file.name,
      projectName: currentProjectName || file.name.replace(/\.[^/.]+$/, ""), // 移除扩展名作为项目名
      videoFile: file
    });
  },

  // Subtitle defaults
  subtitleLines: [],
  subtitleFileName: '',
  fileHandle: null,
  hasUnsavedChanges: false,
  setSubtitles: (lines, fileName, fileHandle = null) =>
    set({subtitleLines: lines, subtitleFileName: fileName, fileHandle, hasUnsavedChanges: false}),

  updateSubtitleText: (id, text) => {
    const currentState = get().subtitleLines;
    const beforeState = [...currentState];
    const afterState = currentState.map(s =>
      (s.id === id && s.status !== 'locked' && s.status !== 'ignored')
        ? {...s, text}
        : s
    );

    // 记录操作到历史记录
    globalUndoRedoManager.addOperation({
      type: 'UPDATE_SUBTITLE_TEXT',
      beforeState,
      afterState,
      params: { id, text }
    });

    set({
      subtitleLines: afterState,
      hasUnsavedChanges: true
    });
  },

  updateSubtitleTime: (id, start, end) => {
    const currentState = get().subtitleLines;
    const beforeState = [...currentState];
    const afterState = currentState.map(s =>
      (s.id === id && s.status !== 'locked' && s.status !== 'ignored')
        ? {...s, startTime: start, endTime: end}
        : s
    );

    // 记录操作到历史记录
    globalUndoRedoManager.addOperation({
      type: 'UPDATE_SUBTITLE_TIME',
      beforeState,
      afterState,
      params: { id, start, end }
    });

    set({
      subtitleLines: afterState,
      hasUnsavedChanges: true
    });
  },

  toggleSubtitleLineStatus: (id) => set((state) => ({
    subtitleLines: state.subtitleLines.map(s => s.id === id ? {
      ...s,
      status: s.status === 'normal' ? 'ignored' :
              s.status === 'ignored' ? 'locked' :
              'normal'
    } : s)
  })),

  setSubtitleLineStatus: (id: number, status: 'normal' | 'locked' | 'ignored') => set((state) => ({
    subtitleLines: state.subtitleLines.map(s => s.id === id ? {
      ...s,
      status,
    } : s)
  })),

  addSubtitleLine: (subLine: SubtitleLine) => {
    const currentState = get().subtitleLines;
    const beforeState = [...currentState];
    const afterState = [...currentState, subLine].sort((a, b) => a.startTime - b.startTime);

    // 记录操作到历史记录
    globalUndoRedoManager.addOperation({
      type: 'ADD_SUBTITLE_LINE',
      beforeState,
      afterState,
      params: { sub: subLine }
    });

    set({
      subtitleLines: afterState,
      hasUnsavedChanges: true
    });
  },

  getSubtitleLine: (id: number) => {
    return get().subtitleLines.find(line => line.id === id) || null;
  },

  mergeSubtitleLines: (ids: number[]) => {
    const linesToMerge = get().subtitleLines.filter(s => ids.includes(s.id));
    if (linesToMerge.length < 2) return;
    const beforeState = [...get().subtitleLines];
    linesToMerge.sort((a, b) => a.startTime - b.startTime);
    const startTime = linesToMerge[0].startTime;
    const endTime = linesToMerge.at(-1).endTime;
    const text = linesToMerge.map(l => l.text).join('\n');
    const newSubLine: SubtitleLine = {
      id: linesToMerge[0].id,
      startTime,
      endTime,
      text,
      status: 'normal'
    };
    const afterState = [...beforeState.filter(s => !ids.includes(s.id)), newSubLine]
      .sort((a, b) => a.startTime - b.startTime);

    // 记录操作到历史记录
    globalUndoRedoManager.addOperation({
      type: 'MERGE_SUBTITLE_LINES',
      beforeState,
      afterState,
    });

    set({
      subtitleLines: afterState,
      hasUnsavedChanges: true
    });
  },

  removeSubtitle: (id) => {
    const currentState = get().subtitleLines;
    const beforeState = [...currentState];
    const removedSubtitle = currentState.find(s => s.id === id);
    const afterState = currentState.filter(s => s.id !== id);

    // 记录操作到历史记录
    globalUndoRedoManager.addOperation({
      type: 'REMOVE_SUBTITLE_LINE',
      beforeState,
      afterState,
      params: { id, removedSubtitle }
    });

    set({
      subtitleLines: afterState,
      hasUnsavedChanges: true
    });
  },

  // Shift all subtitles by offset. Applies to locked files too to maintain relative sync with video.
  shiftSubtitles: (offset) => {
    const currentState = get().subtitleLines;
    const beforeState = [...currentState];
    const afterState = currentState.map(s => ({
      ...s,
      startTime: Math.max(0, s.startTime + offset),
      endTime: Math.max(0, s.endTime + offset)
    }));

    // 记录操作到历史记录
    globalUndoRedoManager.addOperation({
      type: 'SHIFT_SUBTITLES',
      beforeState,
      afterState,
      params: { offset }
    });

    set({
      subtitleLines: afterState,
      hasUnsavedChanges: true
    });
  },

  setHasUnsavedChanges: (val) => set({hasUnsavedChanges: val}),

  // Undo/Redo 实现
  undo: () => {
    const operation = globalUndoRedoManager.undo();
    if (operation) {
      set({
        subtitleLines: operation.beforeState,
        hasUnsavedChanges: true
      });
    }
  },

  redo: () => {
    const operation = globalUndoRedoManager.redo();
    if (operation) {
      set({
        subtitleLines: operation.afterState,
        hasUnsavedChanges: true
      });
    }
  },

  canUndo: () => globalUndoRedoManager.canUndo(),

  canRedo: () => globalUndoRedoManager.canRedo(),

  // Break up a subtitle line into two based on text content
  breakUpSubtitleLine: (id: number) => {
    const currentState = get().subtitleLines;
    const beforeState = [...currentState];
    
    const subtitleToSplit = currentState.find(s => s.id === id);
    if (!subtitleToSplit) return; // Subtitle line not found

    // Find the split point in the text
    let splitIndex = -1;
    const text = subtitleToSplit.text;
    
    // Look for spaces (either half-width or full-width) or newlines to split on
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i])) { // Matches any whitespace character (space, tab, etc.)
        splitIndex = i;
        break;
      }
    }
    
    let firstPart: string, secondPart: string;
    let firstDurationRatio: number;
    
    if (splitIndex > 0) {
      // Split at the first space found
      firstPart = text.substring(0, splitIndex).trim();
      secondPart = text.substring(splitIndex + 1).trim();
      
      // Calculate duration ratios based on text length
      const firstLength = firstPart.length;
      const secondLength = secondPart.length;
      const totalLength = firstLength + secondLength;
      
      firstDurationRatio = totalLength > 0 ? firstLength / totalLength : 0.5;
    } else {
      // No space found, split evenly and keep the same text
      firstPart = text;
      secondPart = text;
      firstDurationRatio = 0.5;
    }
    
    // Calculate new start and end times for the two parts
    const totalTime = subtitleToSplit.endTime - subtitleToSplit.startTime;
    const firstEndTime = subtitleToSplit.startTime + (totalTime * firstDurationRatio);
    
    // Create the two new subtitle lines
    const newSubtitle1: SubtitleLine = {
      ...subtitleToSplit, // Copy all properties including status
      id: subtitleToSplit.id, // Keep the original ID for the first part
      text: firstPart,
      endTime: firstEndTime - 0.05,
      status: 'normal',
    };
    
    const newSubtitle2: SubtitleLine = {
      ...subtitleToSplit, // Copy all properties including status
      id: Math.max(...currentState.map(s => s.id), 0) + 1, // Generate a new ID
      text: secondPart,
      startTime: firstEndTime + 0.05,
      endTime: subtitleToSplit.endTime,
      status: 'normal',
    };
    
    // Create the new subtitle array: replace the original with the two new ones
    const afterState = currentState
      .filter(s => s.id !== id) // Remove the original subtitle
      .concat([newSubtitle1, newSubtitle2]) // Add the two new subtitles
      .sort((a, b) => a.startTime - b.startTime); // Sort by start time

    // Record operation to history
    globalUndoRedoManager.addOperation({
      type: 'SPLIT_SUBTITLE_LINE',
      beforeState,
      afterState,
      params: { id, originalSubtitle: subtitleToSplit }
    });

    set({
      subtitleLines: afterState,
      hasUnsavedChanges: true
    });
  },

  // Anki defaults
  ankiCards: [],
  ankiConfig: DEFAULT_NOTE_TYPE,
  processing: {isAnalyzing: false, progress: 0, total: 0},
  addCard: (card) => set((state) => ({ankiCards: [card, ...state.ankiCards]})),
  updateCardSyncStatus: (id, syncStatus) => set((state) => ({
    ankiCards: state.ankiCards.map(c => c.id === id ? {...c, syncStatus} : c)
  })),
  updateCardAudioStatus: (id, audioStatus, audioRef? : string | null) => set((state) => ({
    ankiCards: state.ankiCards.map(c => c.id === id ? {...c, audioStatus, audioRef} : c)
  })),
  deleteCard: (id) => set((state) => ({ankiCards: state.ankiCards.filter(c => c.id !== id)})),
  clearCards: () => set((_) => ({ankiCards: []})),
  setAnkiConfig: (config) => set({ankiConfig: config}),

  // Anki Connect
  ankiConnectUrl: localStorage.getItem('subs2anki_anki_url') || 'http://127.0.0.1:8765',
  setAnkiConnectUrl: (url) => {
    localStorage.setItem('subs2anki_anki_url', url);
    set({ankiConnectUrl: url});
  },

  // Settings
  bulkCreateLimit: parseInt(localStorage.getItem('subs2anki_bulk_create_limit') || '10'),
  setBulkCreateLimit: (limit) => {
    localStorage.setItem('subs2anki_bulk_create_limit', limit.toString());
    set({bulkCreateLimit: limit});
  },
  autoDeleteSynced: localStorage.getItem('subs2anki_auto_delete_synced') === 'true',
  setAutoDeleteSynced: (enabled) => {
    localStorage.setItem('subs2anki_auto_delete_synced', enabled.toString());
    set({autoDeleteSynced: enabled});
  },
  showBulkCreateButton: localStorage.getItem('subs2anki_show_bulk_create_button') !== 'false', // 默认为true
  setShowBulkCreateButton: (show) => {
    localStorage.setItem('subs2anki_show_bulk_create_button', show.toString());
    set({showBulkCreateButton: show});
  },
  audioVolume: parseFloat(localStorage.getItem('subs2anki_audio_volume') || '1.5'),
  setAudioVolume: (volume) => {
    localStorage.setItem('subs2anki_audio_volume', volume.toString());
    set({audioVolume: volume});
  }
}));
