import {create} from 'zustand';
import {SubtitleLine, AnkiCard, AnkiNoteType, ProcessingState} from './types.ts';
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
    {name: "Notes", source: 'Notes'}
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
  addSubtitle: (sub: SubtitleLine) => void;
  removeSubtitle: (id: number) => void;
  shiftSubtitles: (offset: number) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

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

// 创建全局的 undo/redo 管理器实例
const globalUndoRedoManager = new UndoRedoManager();

export const useAppStore = create<AppState>((set, get) => ({
  projectName: '', // 默认项目名称为空
  setProjectName: (name) => set({ projectName: name }),

  // Video defaults
  videoSrc: '',
  videoName: '',
  videoFile: null,
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
      status: s.status === 'normal' ? 'locked' :
              s.status === 'locked' ? 'ignored' :
              'normal'
    } : s)
  })),

  setSubtitleLineStatus: (id: number, status: 'normal' | 'locked' | 'ignored') => set((state) => ({
    subtitleLines: state.subtitleLines.map(s => s.id === id ? {
      ...s,
      status,
    } : s)
  })),

  addSubtitle: (sub) => {
    const currentState = get().subtitleLines;
    const beforeState = [...currentState];
    const afterState = [...currentState, sub].sort((a, b) => a.startTime - b.startTime);

    // 记录操作到历史记录
    globalUndoRedoManager.addOperation({
      type: 'ADD_SUBTITLE',
      beforeState,
      afterState,
      params: { sub }
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
      type: 'REMOVE_SUBTITLE',
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
