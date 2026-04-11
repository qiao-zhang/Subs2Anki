import {describe, expect, it, vi, afterEach} from 'vitest';
import {syncToAnki} from '@/services/anki-connect.ts';
import {AnkiCard, AnkiNoteType} from '@/services/types.ts';

describe('syncToAnki', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('awaits async onCardSynced callback before resolving', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body || '{}')) as { action?: string };

      if (body.action === 'modelNames') {
        return new Response(JSON.stringify({result: ['Subs2Anki'], error: null}), {status: 200});
      }

      return new Response(JSON.stringify({result: null, error: null}), {status: 200});
    });

    vi.stubGlobal('fetch', fetchMock);

    const noteType: AnkiNoteType = {
      id: 1,
      name: 'Subs2Anki',
      css: '',
      fields: [{name: 'CurrentFront', source: 'Text'}],
      templates: [{Name: 'Card 1', Front: '{{CurrentFront}}', Back: '{{CurrentFront}}'}],
    };

    const card: AnkiCard = {
      id: 'c1',
      subtitleId: 1,
      text: 'hello',
      translation: '',
      notes: '',
      screenshotRef: null,
      audioRef: null,
      timestampStr: '00:01.0',
      audioStatus: 'done',
      syncStatus: 'unsynced',
    };

    let callbackFinished = false;
    const onCardSynced = async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
      callbackFinished = true;
    };

    await syncToAnki(
      'http://127.0.0.1:8765',
      'DeckA',
      noteType,
      [card],
      [],
      () => {},
      onCardSynced,
    );

    expect(callbackFinished).toBe(true);
  });
});

