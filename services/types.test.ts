import { describe, it, expect } from 'vitest';
import { SubtitleLine, AnkiCard } from './types';

describe('Type Definitions', () => {
  it('should include group-related fields in SubtitleLine', () => {
    const subtitleLine: SubtitleLine = {
      id: 1,
      startTime: 0,
      endTime: 2,
      text: 'Test subtitle',
      status: 'normal',
      groupId: 'test-group',
      prevText: 'Previous text',
      prevAudio: 'Previous audio',
      nextText: 'Next text',
      nextAudio: 'Next audio',
    };

    expect(subtitleLine.id).toBe(1);
    expect(subtitleLine.startTime).toBe(0);
    expect(subtitleLine.endTime).toBe(2);
    expect(subtitleLine.text).toBe('Test subtitle');
    expect(subtitleLine.status).toBe('normal');
    expect(subtitleLine.groupId).toBe('test-group');
    expect(subtitleLine.prevText).toBe('Previous text');
    expect(subtitleLine.prevAudio).toBe('Previous audio');
    expect(subtitleLine.nextText).toBe('Next text');
    expect(subtitleLine.nextAudio).toBe('Next audio');
  });

  it('should include group-related fields in AnkiCard', () => {
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

    expect(ankiCard.id).toBe('card1');
    expect(ankiCard.subtitleId).toBe(1);
    expect(ankiCard.text).toBe('Test subtitle');
    expect(ankiCard.translation).toBe('Translation');
    expect(ankiCard.notes).toBe('Notes');
    expect(ankiCard.furigana).toBe('Furigana');
    expect(ankiCard.tags).toEqual(['tag1', 'tag2']);
    expect(ankiCard.screenshotRef).toBe('screenshot-ref');
    expect(ankiCard.audioRef).toBe('audio-ref');
    expect(ankiCard.timestampStr).toBe('00:01');
    expect(ankiCard.audioStatus).toBe('done');
    expect(ankiCard.syncStatus).toBe('unsynced');
    expect(ankiCard.prevText).toBe('Previous text');
    expect(ankiCard.prevAudio).toBe('Previous audio');
    expect(ankiCard.nextText).toBe('Next text');
    expect(ankiCard.nextAudio).toBe('Next audio');
  });

  it('should allow optional group-related fields in SubtitleLine', () => {
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
    expect(subtitleLine.groupId).toBeUndefined();
    expect(subtitleLine.prevText).toBeUndefined();
    expect(subtitleLine.prevAudio).toBeUndefined();
    expect(subtitleLine.nextText).toBeUndefined();
    expect(subtitleLine.nextAudio).toBeUndefined();
  });

  it('should allow optional group-related fields in AnkiCard', () => {
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

    expect(ankiCard.id).toBe('card1');
    expect(ankiCard.subtitleId).toBe(1);
    expect(ankiCard.text).toBe('Test subtitle');
    expect(ankiCard.translation).toBe('Translation');
    expect(ankiCard.notes).toBe('Notes');
    expect(ankiCard.furigana).toBe('Furigana');
    expect(ankiCard.tags).toEqual(['tag1', 'tag2']);
    expect(ankiCard.screenshotRef).toBe('screenshot-ref');
    expect(ankiCard.audioRef).toBe('audio-ref');
    expect(ankiCard.timestampStr).toBe('00:01');
    expect(ankiCard.audioStatus).toBe('done');
    expect(ankiCard.syncStatus).toBe('unsynced');
    expect(ankiCard.prevText).toBeUndefined();
    expect(ankiCard.prevAudio).toBeUndefined();
    expect(ankiCard.nextText).toBeUndefined();
    expect(ankiCard.nextAudio).toBeUndefined();
  });
});