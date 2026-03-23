import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../services/store.ts';
import type { SubtitleLine, AnkiCard } from '../../services/types.ts';

describe('App Store', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
  });

  it('stores and resets uploaded video state', () => {
    const file = new File(['video'], 'lesson.mp4', { type: 'video/mp4' });

    useAppStore.getState().setVideo(file);
    let state = useAppStore.getState();
    expect(state.videoFile).toBe(file);
    expect(state.videoPath).toBeNull();
    expect(state.videoName).toBe('lesson.mp4');
    expect(state.videoSrc.startsWith('blob:')).toBe(true);

    useAppStore.getState().resetVideo();
    state = useAppStore.getState();
    expect(state.videoFile).toBeNull();
    expect(state.videoPath).toBeNull();
    expect(state.videoSrc).toBe('');
    expect(state.videoName).toBe('');
  });

  it('stores tauri video paths separately from browser File objects', () => {
    useAppStore.getState().setTauriVideo('C:/videos/clip.mp4', 'asset://clip.mp4');

    const state = useAppStore.getState();
    expect(state.videoFile).toBeNull();
    expect(state.videoPath).toBe('C:/videos/clip.mp4');
    expect(state.videoSrc).toBe('asset://clip.mp4');
    expect(state.videoName).toBe('clip.mp4');
  });

  it('supports undo and redo for subtitle text updates', () => {
    const subtitles: SubtitleLine[] = [
      { id: 1, startTime: 0, endTime: 2, text: 'before', status: 'normal' },
    ];

    useAppStore.getState().setSubtitles(subtitles, 'lesson.srt');
    useAppStore.getState().updateSubtitleText(1, 'after');
    expect(useAppStore.getState().subtitleLines[0].text).toBe('after');
    expect(useAppStore.getState().canUndo()).toBe(true);

    useAppStore.getState().undo();
    expect(useAppStore.getState().subtitleLines[0].text).toBe('before');
    expect(useAppStore.getState().canRedo()).toBe(true);

    useAppStore.getState().redo();
    expect(useAppStore.getState().subtitleLines[0].text).toBe('after');
  });

  it('retries only cards blocked by missing FFmpeg', () => {
    const recoverableCard: AnkiCard = {
      id: 'recoverable',
      subtitleId: 1,
      text: 'Line 1',
      translation: '',
      notes: '',
      screenshotRef: null,
      audioRef: null,
      timestampStr: '00:01',
      audioStatus: 'error',
      audioErrorReason: 'ffmpeg_unavailable',
      syncStatus: 'unsynced',
    };
    const otherErrorCard: AnkiCard = {
      id: 'other-error',
      subtitleId: 2,
      text: 'Line 2',
      translation: '',
      notes: '',
      screenshotRef: null,
      audioRef: null,
      timestampStr: '00:02',
      audioStatus: 'error',
      syncStatus: 'unsynced',
    };

    useAppStore.setState({ ankiCards: [recoverableCard, otherErrorCard] });
    useAppStore.getState().retryCardsBlockedByFfmpeg();

    const [updatedRecoverable, updatedOther] = useAppStore.getState().ankiCards;
    expect(updatedRecoverable.audioStatus).toBe('pending');
    expect(updatedRecoverable.audioErrorReason).toBeUndefined();
    expect(updatedOther.audioStatus).toBe('error');
    expect(updatedOther.audioErrorReason).toBeUndefined();
  });

  it('breakUpSubtitleLine splits around nearest whitespace and keeps status guard behavior', () => {
    const normalLine: SubtitleLine = { id: 1, startTime: 0, endTime: 4, text: 'hello world here', status: 'normal' };
    const lockedLine: SubtitleLine = { id: 2, startTime: 5, endTime: 9, text: 'locked line text', status: 'locked' };
    const ignoredLine: SubtitleLine = { id: 3, startTime: 10, endTime: 14, text: 'ignored line text', status: 'ignored' };
    useAppStore.getState().setSubtitles([normalLine, lockedLine, ignoredLine], 'lesson.srt');

    useAppStore.getState().breakUpSubtitleLine(1);
    useAppStore.getState().breakUpSubtitleLine(2);
    useAppStore.getState().breakUpSubtitleLine(3);

    const after = useAppStore.getState().subtitleLines;
    const splitNormal = after.find(line => line.id === 1);
    const createdFromSplit = after.find(line => line.id !== 1 && line.startTime >= 0 && line.endTime <= 4);
    const splitLocked = after.find(line => line.id === 2);
    const splitIgnored = after.find(line => line.id === 3);

    expect(splitNormal?.text).toBe('hello');
    expect(createdFromSplit?.text).toBe('world here');
    expect(splitNormal?.status).toBe('normal');
    expect(createdFromSplit?.status).toBe('normal');
    expect(splitLocked?.status).toBe('normal');
    expect(splitIgnored?.status).toBe('normal');
  });

  it('breakUpSubtitleLine duplicates text when no whitespace exists', () => {
    const line: SubtitleLine = { id: 9, startTime: 0, endTime: 2, text: 'abcdefgh', status: 'normal' };
    useAppStore.getState().setSubtitles([line], 'lesson.srt');

    useAppStore.getState().breakUpSubtitleLine(9);

    const after = useAppStore.getState().subtitleLines.filter(s => s.startTime >= 0 && s.endTime <= 2.1);
    expect(after).toHaveLength(2);
    expect(after[0].text).toBe('abcdefgh');
    expect(after[1].text).toBe('abcdefgh');
  });

  it('breakUpSubtitleLine handles multiple whitespace and trims split text', () => {
    const line: SubtitleLine = { id: 10, startTime: 0, endTime: 6, text: 'left   middle   right', status: 'normal' };
    useAppStore.getState().setSubtitles([line], 'lesson.srt');

    useAppStore.getState().breakUpSubtitleLine(10);

    const split = useAppStore.getState().subtitleLines.filter(s => s.startTime >= 0 && s.endTime <= 6.1);
    expect(split).toHaveLength(2);
    expect(split[0].text.endsWith(' ')).toBe(false);
    expect(split[1].text.startsWith(' ')).toBe(false);
    expect(split[0].text.length).toBeGreaterThan(0);
    expect(split[1].text.length).toBeGreaterThan(0);
  });
});
