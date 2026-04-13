import '@testing-library/jest-dom/vitest';
import {afterEach, beforeEach, vi} from 'vitest';
import {cleanup} from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === 'string' ? options.defaultValue : key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(() => Promise.resolve()),
    },
  }),
}));

beforeEach(() => {
  vi.restoreAllMocks();

  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);

  if (typeof window !== 'undefined') {
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  }
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
});

