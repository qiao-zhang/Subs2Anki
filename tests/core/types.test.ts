import { describe, it, expect } from 'vitest';
import { SubtitleLine, AnkiCard } from '../../services/types.ts';

describe('Type Definitions', () => {
  it('defines the current SubtitleLine shape', () => {
    const subtitleLine: SubtitleLine = {
      id: 1,
      startTime: 0,
      endTime: 2,
      text: 'Test subtitle',
      status: 'normal',
    };

    expect(subtitleLine.id).toBe(1);
    expect(subtitleLine.startTime).toBe(0);
    expect(subtitleLine.endTime).toBe(2);
    expect(subtitleLine.text).toBe('Test subtitle');
    expect(subtitleLine.status).toBe('normal');
  });

  it('allows optional neighbor fields in AnkiCard', () => {
    const ankiCard: AnkiCard = {
      id: 'card1',
      subtitleId: 1,
      text: 'Test subtitle',
      translation: 'Translation',
      notes: 'Notes',
      furigana: 'Furigana',
      tags: ['tag1', 'tag2'],
      screenshotRef: 'screenshot-ref',
      audioRef: 'audio-ref',
      timestampStr: '00:01',
      audioStatus: 'done',
      syncStatus: 'unsynced',
      prevText: 'Previous text',
      prevAudio: 'Previous audio',
      nextText: 'Next text',
      nextAudio: 'Next audio',
    };

    expect(ankiCard.prevText).toBe('Previous text');
    expect(ankiCard.prevAudio).toBe('Previous audio');
    expect(ankiCard.nextText).toBe('Next text');
    expect(ankiCard.nextAudio).toBe('Next audio');
  });

  it('keeps neighbor fields optional on AnkiCard', () => {
    const ankiCard: AnkiCard = {
      id: 'card1',
      subtitleId: 1,
      text: 'Test subtitle',
      translation: 'Translation',
      notes: 'Notes',
      furigana: 'Furigana',
      tags: ['tag1', 'tag2'],
      screenshotRef: 'screenshot-ref',
      audioRef: 'audio-ref',
      timestampStr: '00:01',
      audioStatus: 'done',
      syncStatus: 'unsynced',
    };

    expect(ankiCard.prevText).toBeUndefined();
    expect(ankiCard.prevAudio).toBeUndefined();
    expect(ankiCard.nextText).toBeUndefined();
    expect(ankiCard.nextAudio).toBeUndefined();
  });

  it('allows optional audio error reasons on AnkiCard', () => {
    const ankiCard: AnkiCard = {
      id: 'card-audio-error',
      subtitleId: 1,
      text: 'Test subtitle',
      translation: 'Translation',
      notes: 'Notes',
      screenshotRef: null,
      audioRef: null,
      timestampStr: '00:01',
      audioStatus: 'error',
      audioErrorReason: 'ffmpeg_unavailable',
      syncStatus: 'unsynced',
    };

    expect(ankiCard.audioErrorReason).toBe('ffmpeg_unavailable');
  });
});