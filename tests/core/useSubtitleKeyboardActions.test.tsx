/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useSubtitleKeyboardActions } from '@/hooks/useSubtitleKeyboardActions.ts';
import type { SubtitleLine } from '@/services/types.ts';
import type { VideoPlayerHandle } from '@/components/VideoPlayer.tsx';

const subtitleLines: SubtitleLine[] = [
  { id: 1, startTime: 1, endTime: 2, text: 'one', status: 'normal' },
  { id: 2, startTime: 3, endTime: 4, text: 'two', status: 'normal' },
];

const createVideoPlayerHandle = (overrides: Partial<VideoPlayerHandle> = {}): VideoPlayerHandle => ({
  seekTo: vi.fn(),
  play: vi.fn(async () => undefined),
  pause: vi.fn(),
  playPause: vi.fn(),
  captureFrame: vi.fn(async () => null),
  captureFrameAt: vi.fn(async () => null),
  getCurrentTime: vi.fn(() => 0),
  getVideoElement: vi.fn(() => null),
  ...overrides,
});

function Probe(props: {
  activeSubtitleLineId: number | null;
  tempSubtitleLine: { start: number; end: number } | null;
  getSubtitleLine?: (id: number) => SubtitleLine | undefined;
  playTimeSpan?: (start: number, end: number) => void;
  mergeSubtitleLines?: (ids: number[]) => void;
  getVideoPlayerHandle?: () => VideoPlayerHandle | null;
  handleSubtitleLineClicked?: (id: number) => void;
}) {
  useSubtitleKeyboardActions({
    subtitleLines,
    activeSubtitleLineId: props.activeSubtitleLineId,
    currentTime: 0,
    tempSubtitleLine: props.tempSubtitleLine,
    regionsHidden: false,
    isVideoOnly: false,
    getSubtitleLine: props.getSubtitleLine ?? ((id) => subtitleLines.find(s => s.id === id)),
    toggleSubtitleLineStatus: vi.fn(),
    removeSubtitle: vi.fn(),
    breakUpSubtitleLine: vi.fn(),
    mergeSubtitleLines: props.mergeSubtitleLines ?? vi.fn(),
    canUndo: () => false,
    canRedo: () => false,
    undo: vi.fn(),
    redo: vi.fn(),
    handleCreateCard: vi.fn(async () => undefined),
    handleSubtitleLineClicked: props.handleSubtitleLineClicked ?? vi.fn(),
    playTimeSpan: props.playTimeSpan ?? vi.fn(),
    playEdge: vi.fn(),
    setActiveSubtitleLineId: vi.fn(),
    setTempSubtitleLine: vi.fn(),
    setRegionsHidden: vi.fn(),
    setIsVideoOnlyMode: vi.fn(),
    setIsShortcutsModalOpen: vi.fn(),
    setIsSettingsModalOpen: vi.fn(),
    getVideoPlayerHandle: props.getVideoPlayerHandle ?? (() => createVideoPlayerHandle()),
  });
  return null;
}

describe('useSubtitleKeyboardActions regression', () => {
  afterEach(() => {
    cleanup();
  });

  it('replay uses temp subtitle span when no active selection exists', () => {
    const playTimeSpan = vi.fn();
    render(
      <Probe
        activeSubtitleLineId={null}
        tempSubtitleLine={{ start: 10, end: 12 }}
        playTimeSpan={playTimeSpan}
      />,
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(playTimeSpan).toHaveBeenCalledWith(10, 12);
  });

  it('replay falls back to player playPause when no active/temp selection', () => {
    const playPause = vi.fn();
    render(
      <Probe
        activeSubtitleLineId={null}
        tempSubtitleLine={null}
        getVideoPlayerHandle={() => createVideoPlayerHandle({ playPause })}
      />,
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(playPause).toHaveBeenCalledOnce();
  });

  it('merge guard prevents merge when no next subtitle exists', () => {
    const mergeSubtitleLines = vi.fn();
    render(
      <Probe
        activeSubtitleLineId={2}
        tempSubtitleLine={null}
        mergeSubtitleLines={mergeSubtitleLines}
      />,
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' }));
    expect(mergeSubtitleLines).not.toHaveBeenCalled();
  });
});

