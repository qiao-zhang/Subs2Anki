import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../../services/store.ts';
import type { SubtitleLine } from '../../services/types.ts';

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
});