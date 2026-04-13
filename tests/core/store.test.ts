import {beforeEach, describe, expect, it} from 'vitest';
import {useAppStore} from '../../services/store.ts';
import {SubtitleLine} from '../../services/types.ts';

const subtitleLines: SubtitleLine[] = [
  {id: 1, startTime: 0, endTime: 2, text: 'Subtitle 1', status: 'normal'},
  {id: 2, startTime: 3, endTime: 5, text: 'Subtitle 2', status: 'locked'},
  {id: 3, startTime: 6, endTime: 8, text: 'Subtitle 3', status: 'normal'},
];

describe('useAppStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAppStore.setState({
      subtitleLines: [],
      subtitleFileName: '',
      fileHandle: null,
      hasUnsavedChanges: false,
      screenshotTimingPercent: 50,
    });
  });

  it('sets subtitles with file metadata and clears unsaved changes', () => {
    const fileHandle = {
      getFile: async () => new File(['a'], 'a.srt'),
      createWritable: async () => ({
        write: async () => undefined,
        close: async () => undefined,
      }),
    } as unknown as FileSystemFileHandle;

    useAppStore.getState().setSubtitles(subtitleLines, 'demo.srt', fileHandle);

    const state = useAppStore.getState();
    expect(state.subtitleLines).toEqual(subtitleLines);
    expect(state.subtitleFileName).toBe('demo.srt');
    expect(state.fileHandle).toBe(fileHandle);
    expect(state.hasUnsavedChanges).toBe(false);
  });

  it('cycles subtitle status using the default NIL order', () => {
    useAppStore.setState({subtitleLines: [subtitleLines[0]]});

    useAppStore.getState().toggleSubtitleLineStatus(1);
    expect(useAppStore.getState().subtitleLines[0]?.status).toBe('ignored');

    useAppStore.getState().toggleSubtitleLineStatus(1);
    expect(useAppStore.getState().subtitleLines[0]?.status).toBe('locked');

    useAppStore.getState().toggleSubtitleLineStatus(1);
    expect(useAppStore.getState().subtitleLines[0]?.status).toBe('normal');
  });

  it('counts subtitle lines before a time by status', () => {
    useAppStore.setState({subtitleLines});

    expect(useAppStore.getState().countSubtitleLinesBefore(6.5)).toBe(1);
    expect(useAppStore.getState().countSubtitleLinesBefore(6.5, 'locked')).toBe(1);
    expect(useAppStore.getState().countSubtitleLinesBefore(6.5, 'ignored')).toBe(0);
  });

  it('clamps screenshot timing percent and persists it', () => {
    useAppStore.getState().setScreenshotTimingPercent(250);
    expect(useAppStore.getState().screenshotTimingPercent).toBe(100);
    expect(window.localStorage.getItem('subs2anki_screenshot_timing_percent')).toBe('100');

    useAppStore.getState().setScreenshotTimingPercent(-10);
    expect(useAppStore.getState().screenshotTimingPercent).toBe(0);
    expect(window.localStorage.getItem('subs2anki_screenshot_timing_percent')).toBe('0');
  });
});