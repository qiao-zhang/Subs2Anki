import { describe, expect, it, vi } from 'vitest';
import { ExportDeckError, generateAnkiDeck, isExportDeckError } from '../../services/export.ts';
import type { AnkiCard, AnkiNoteType } from '../../services/types.ts';

const createAnkiDatabaseMock = vi.hoisted(() => vi.fn());
const getMediaMock = vi.hoisted(() => vi.fn());
const saveAsMock = vi.hoisted(() => vi.fn());
const zipFileMock = vi.hoisted(() => vi.fn());
const zipGenerateAsyncMock = vi.hoisted(() => vi.fn(async () => new Blob(['deck'])));

vi.mock('../../services/anki-db.ts', () => ({
  createAnkiDatabase: createAnkiDatabaseMock,
}));

vi.mock('../../services/db.ts', () => ({
  getMedia: getMediaMock,
}));

vi.mock('file-saver', () => ({
  default: saveAsMock,
}));

vi.mock('jszip', () => ({
  default: class MockZip {
    file = zipFileMock;
    generateAsync = zipGenerateAsyncMock;
  },
}));

const noteType: AnkiNoteType = {
  id: 1,
  name: 'Subs2Anki',
  css: '',
  fields: [{ name: 'Front', source: 'Text' }],
  templates: [{ Name: 'Card 1', Front: '{{Front}}', Back: '{{Front}}' }],
};

const card: AnkiCard = {
  id: 'card-1',
  subtitleId: 1,
  text: 'Text',
  translation: '',
  notes: '',
  screenshotRef: null,
  audioRef: null,
  timestampStr: '00:01',
  audioStatus: 'done',
  syncStatus: 'unsynced',
};

describe('export service structured errors', () => {
  it('returns NO_CARDS structured error when exporting empty cards', async () => {
    await expect(generateAnkiDeck([], [], 'Deck', noteType)).rejects.toMatchObject({
      name: 'ExportDeckError',
      code: 'NO_CARDS',
    });
  });

  it('returns DATABASE_CREATION_FAILED structured error when db creation fails', async () => {
    createAnkiDatabaseMock.mockRejectedValueOnce(new Error('db unavailable'));

    await expect(generateAnkiDeck([card], [], 'Deck', noteType)).rejects.toMatchObject({
      name: 'ExportDeckError',
      code: 'DATABASE_CREATION_FAILED',
    });
  });

  it('returns PACKAGE_GENERATION_FAILED structured error when package generation fails', async () => {
    createAnkiDatabaseMock.mockResolvedValueOnce(new Uint8Array([1, 2, 3]));
    getMediaMock.mockResolvedValue(null);
    zipGenerateAsyncMock.mockRejectedValueOnce(new Error('zip broken'));

    await expect(generateAnkiDeck([card], [], 'Deck', noteType)).rejects.toMatchObject({
      name: 'ExportDeckError',
      code: 'PACKAGE_GENERATION_FAILED',
    });
  });

  it('type guard identifies ExportDeckError', () => {
    const error = new ExportDeckError('NO_CARDS', 'Deck export requires at least one card.');
    expect(isExportDeckError(error)).toBe(true);
    expect(isExportDeckError(new Error('generic'))).toBe(false);
  });
});

