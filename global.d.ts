declare const __APP_VERSION__: string;
declare const __TAURI_BUILD__: boolean;

type BrowserWritableContent = string | Blob | BufferSource;

interface BrowserWritableFileStream {
  write(data: BrowserWritableContent): Promise<void>;
  close(): Promise<void>;
}

interface BrowserFileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<BrowserWritableFileStream>;
}

interface BrowserFilePickerAcceptType {
  description?: string;
  accept?: Record<string, string[]>;
}

interface BrowserOpenFilePickerOptions {
  multiple?: boolean;
  types?: BrowserFilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
}

interface BrowserSaveFilePickerOptions {
  suggestedName?: string;
  types?: BrowserFilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
}

interface Window {
  showOpenFilePicker?: (options?: BrowserOpenFilePickerOptions) => Promise<BrowserFileHandle[]>;
  showSaveFilePicker?: (options?: BrowserSaveFilePickerOptions) => Promise<BrowserFileHandle>;
}
