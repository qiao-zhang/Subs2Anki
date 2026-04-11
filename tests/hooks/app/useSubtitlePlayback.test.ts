import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {useRef} from 'react';
import {useSubtitlePlayback} from '@/hooks/app/useSubtitlePlayback.ts';
import {SubtitleLine} from '@/services/types.ts';
import {VideoPlayerHandle} from '@/components/VideoPlayer.tsx';

const createVideoPlayerHandle = (
  seekTo: (time: number) => void,
  play: () => Promise<void>,
  pause: () => void,
): VideoPlayerHandle => ({
  seekTo,
  play,
  pause,
  playPause: vi.fn(),
  captureFrame: vi.fn(async () => null),
  captureFrameAt: vi.fn(async () => null),
  getCurrentTime: vi.fn(() => 0),
  getVideoElement: vi.fn(() => null),
});

describe('useSubtitlePlayback', () => {
  const subtitleLines: SubtitleLine[] = [
    {id: 1, startTime: 1, endTime: 2, text: 'a', status: 'normal'},
    {id: 2, startTime: 3, endTime: 4, text: 'b', status: 'normal'},
  ];

  it('playTimeSpan seeks and plays while setting pauseAtTime', () => {
    const seekTo = vi.fn();
    const play = vi.fn(async () => undefined);

    const {result} = renderHook(() => {
      const videoPlayerRef = useRef<VideoPlayerHandle | null>(
        createVideoPlayerHandle(seekTo, play, vi.fn())
      );
      return useSubtitlePlayback({
        subtitleLines,
        getSubtitleLine: (id) => subtitleLines.find((s) => s.id === id) || null,
        updateSubtitleTime: vi.fn(),
        addSubtitleLine: vi.fn(),
        videoPlayerRef,
      });
    });

    act(() => {
      result.current.playTimeSpan(1.2, 2.4);
    });

    expect(result.current.pauseAtTime).toBe(2.4);
    expect(seekTo).toHaveBeenCalledWith(1.2);
    expect(play).toHaveBeenCalled();
  });

  it('clears pauseAtTime when handleTimeUpdate reaches pause point', () => {
    const pause = vi.fn();
    const seekTo = vi.fn();

    const {result} = renderHook(() => {
      const videoPlayerRef = useRef<VideoPlayerHandle | null>(
        createVideoPlayerHandle(seekTo, vi.fn(async () => undefined), pause)
      );
      return useSubtitlePlayback({
        subtitleLines,
        getSubtitleLine: (id) => subtitleLines.find((s) => s.id === id) || null,
        updateSubtitleTime: vi.fn(),
        addSubtitleLine: vi.fn(),
        videoPlayerRef,
      });
    });

    act(() => {
      result.current.playTimeSpan(1, 2);
    });

    act(() => {
      result.current.handleTimeUpdate(2.1);
    });

    expect(pause).toHaveBeenCalled();
    expect(seekTo).toHaveBeenCalledWith(2);
    expect(result.current.pauseAtTime).toBeNull();
  });
});
