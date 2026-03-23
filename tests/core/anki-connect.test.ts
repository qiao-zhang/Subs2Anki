import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncToAnki } from '@/services/anki-connect.ts';
import type { AnkiCard, AnkiNoteType } from '@/services/types.ts';

const noteType: AnkiNoteType = {
  id: 1,
  name: 'Subs2AnkiTest',
  css: '',
  fields: [{ name: 'Front', source: 'Text' }],
  templates: [{ Name: 'Card 1', Front: '{{Front}}', Back: '{{Front}}' }],
};

const makeCard = (id: string): AnkiCard => ({
  id,
  subtitleId: 1,
  text: `Text ${id}`,
  translation: '',
  notes: '',
  screenshotRef: null,
  audioRef: null,
  timestampStr: '00:01',
  audioStatus: 'done',
  syncStatus: 'unsynced',
});

describe('syncToAnki', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reports per-card failures instead of treating them as success', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okResult(null))
      .mockResolvedValueOnce(okResult(['Subs2AnkiTest']))
      .mockResolvedValueOnce(errorResult('duplicate note'));

    vi.stubGlobal('fetch', fetchMock);

    const result = await syncToAnki(
      'http://127.0.0.1:8765',
      'Deck',
      noteType,
      [makeCard('card-1')],
      [],
      vi.fn(),
    );

    expect(result.attempted).toBe(1);
    expect(result.succeededIds).toEqual([]);
    expect(result.failed).toEqual([{ id: 'card-1', reason: 'duplicate note' }]);
  });

  it('continues syncing later cards after one card fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okResult(null))
      .mockResolvedValueOnce(okResult(['Subs2AnkiTest']))
      .mockResolvedValueOnce(errorResult('duplicate note'))
      .mockResolvedValueOnce(okResult(102));

    vi.stubGlobal('fetch', fetchMock);

    const result = await syncToAnki(
      'http://127.0.0.1:8765',
      'Deck',
      noteType,
      [makeCard('card-1'), makeCard('card-2')],
      [],
      vi.fn(),
    );

    expect(result.succeededIds).toEqual(['card-2']);
    expect(result.failed).toEqual([{ id: 'card-1', reason: 'duplicate note' }]);
  });
});

function okResult(result: unknown) {
  return {
    ok: true,
    json: async () => ({ result, error: null }),
  } satisfies Pick<Response, 'ok' | 'json'>;
}

function errorResult(error: string) {
  return {
    ok: true,
    json: async () => ({ result: null, error }),
  } satisfies Pick<Response, 'ok' | 'json'>;
}
