export const isTauriRuntime = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.__TAURI_INTERNALS__ !== undefined || window.__TAURI__ !== undefined;
};


