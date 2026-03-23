/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useMediaExportActions } from '@/hooks/useMediaExportActions.ts';
import type { AnkiCard, AnkiNoteType, SubtitleLine } from '@/services/types.ts';

const mocks = vi.hoisted(() => ({
  serializeSubtitles: vi.fn(),
  generateAnkiDeck: vi.fn(),
  isExportDeckError: vi.fn(() => false),
  extractAudioClip: vi.fn(),
  makeMediaFileName: vi.fn(),
  formatTimeForFilename: vi.fn(),
  saveAs: vi.fn(),
}));

vi.mock('@/services/parser.ts', () => ({
  serializeSubtitles: mocks.serializeSubtitles,
}));

vi.mock('@/services/export.ts', () => ({
  generateAnkiDeck: mocks.generateAnkiDeck,
  isExportDeckError: mocks.isExportDeckError,
}));

vi.mock('@/services/ffmpeg.ts', () => ({
  ffmpegService: {
    extractAudioClip: mocks.extractAudioClip,
    prepareVideoSource: vi.fn(),
    getAvailability: vi.fn(),
  },
}));

vi.mock('@/services/filename-utils.ts', () => ({
  makeMediaFileName: mocks.makeMediaFileName,
  formatTimeForFilename: mocks.formatTimeForFilename,
}));

vi.mock('file-saver', () => ({
  default: mocks.saveAs,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string; error?: string }) => {
      if (_key === 'notifications.exportFailedWithError') {
        return `Failed to export deck: ${options?.error}`;
      }
      return options?.defaultValue ?? _key;
    },
  }),
}));

const noteType: AnkiNoteType = {
  id: 1,
  name: 'Subs2Anki',
  css: '',
  fields: [{ name: 'Front', source: 'Text' }],
  templates: [{ Name: 'Card 1', Front: '{{Front}}', Back: '{{Front}}' }],
};

const subtitleLine: SubtitleLine = {
  id: 1,
  startTime: 1.1,
  endTime: 2.6,
  text: 'Line 1',
  status: 'normal',
};

const card: AnkiCard = {
  id: 'card-1',
  subtitleId: 1,
  text: 'Line 1',
  translation: '',
  notes: '',
  screenshotRef: null,
  audioRef: null,
  timestampStr: '00:01',
  audioStatus: 'done',
  syncStatus: 'unsynced',
};

function Probe(props: {
  ensureDesktopFfmpegReady?: (showUi?: boolean) => boolean;
  showNotification?: (text: string) => void;
  setHasUnsavedChanges?: (hasChanges: boolean) => void;
}) {
  const hook = useMediaExportActions({
    subtitleFileName: 'lesson.srt',
    subtitleLines: [subtitleLine],
    subtitlePath: null,
    fileHandle: null,
    setHasUnsavedChanges: props.setHasUnsavedChanges ?? vi.fn(),
    videoFile: new File(['video'], 'lesson.mp4', { type: 'video/mp4' }),
    videoPath: null,
    videoName: 'lesson',
    audioVolume: 1.5,
    tempSubtitleLine: { start: 1.1, end: 2.6 },
    activeSubtitleLineId: null,
    ankiCards: [card],
    globalTags: ['tag-a'],
    projectName: 'Project',
    ankiConfig: noteType,
    ensureDesktopFfmpegReady: props.ensureDesktopFfmpegReady ?? (() => true),
    getVideoPlayerHandle: () => ({
      pause: vi.fn(),
      captureFrame: vi.fn(async () => null),
      captureFrameAt: vi.fn(async () => null),
      playPause: vi.fn(),
      play: vi.fn(async () => undefined),
      seekTo: vi.fn(),
      getCurrentTime: vi.fn(() => 1.5),
      getVideoElement: vi.fn(() => null),
    }),
    getSubtitleLine: (id) => (id === 1 ? subtitleLine : undefined),
    showNotification: props.showNotification ?? vi.fn(),
  });

  return (
    <div>
      <button type="button" onClick={() => void hook.handleDownloadSubtitles()}>download-subtitles</button>
      <button type="button" onClick={() => void hook.handleDownloadAudio()}>download-audio</button>
    </div>
  );
}

describe('useMediaExportActions', () => {
  beforeEach(() => {
    mocks.serializeSubtitles.mockReset();
    mocks.generateAnkiDeck.mockReset();
    mocks.extractAudioClip.mockReset();
    mocks.makeMediaFileName.mockReset();
    mocks.formatTimeForFilename.mockReset();
    mocks.saveAs.mockReset();
    mocks.serializeSubtitles.mockReturnValue('serialized');
    mocks.extractAudioClip.mockResolvedValue(new Blob(['audio'], { type: 'audio/wav' }));
    mocks.makeMediaFileName.mockReturnValue('lesson_00_01_00_02.wav');
    mocks.formatTimeForFilename.mockImplementation((time: number) => (time === 1.1 ? '00_01' : '00_02'));
  });

  afterEach(() => {
    cleanup();
    delete window.showSaveFilePicker;
  });

  it('downloads audio successfully with browser picker', async () => {
    const writable = {
      write: vi.fn(async () => undefined),
      close: vi.fn(async () => undefined),
    };
    window.showSaveFilePicker = vi.fn(async () => ({
      createWritable: vi.fn(async () => writable),
      getFile: vi.fn(),
    }));

    render(<Probe />);
    fireEvent.click(screen.getByText('download-audio'));

    await waitFor(() => {
      expect(writable.write).toHaveBeenCalledOnce();
    });

    expect(mocks.extractAudioClip).toHaveBeenCalledOnce();
    expect(mocks.saveAs).not.toHaveBeenCalled();
  });

  it('falls back to file-saver when subtitle picker is unavailable', async () => {
    const setHasUnsavedChanges = vi.fn();

    render(<Probe setHasUnsavedChanges={setHasUnsavedChanges} />);
    fireEvent.click(screen.getByText('download-subtitles'));

    await waitFor(() => {
      expect(mocks.saveAs).toHaveBeenCalledOnce();
    });

    expect(setHasUnsavedChanges).toHaveBeenCalledWith(false);
  });

  it('skips audio extraction when desktop ffmpeg is unavailable', async () => {
    const ensureDesktopFfmpegReady = vi.fn(() => false);
    render(<Probe ensureDesktopFfmpegReady={ensureDesktopFfmpegReady} />);

    fireEvent.click(screen.getByText('download-audio'));

    expect(ensureDesktopFfmpegReady).toHaveBeenCalled();
    expect(mocks.extractAudioClip).not.toHaveBeenCalled();
  });

  it('shows notification when audio extraction fails', async () => {
    const showNotification = vi.fn();
    mocks.extractAudioClip.mockRejectedValueOnce(new Error('ffmpeg failed'));

    render(<Probe showNotification={showNotification} />);
    fireEvent.click(screen.getByText('download-audio'));

    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith('Audio extraction failed: ffmpeg failed');
    });
  });
});

