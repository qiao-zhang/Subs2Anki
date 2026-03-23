import { useCallback, useState } from 'react';
import type { SubtitleLine } from '@/services/types.ts';
import type { VideoPlayerHandle } from '@/components/VideoPlayer.tsx';

interface TempSubtitleLine {
  start: number;
  end: number;
}

interface UseSubtitlePlaybackSelectionOptions {
  getVideoPlayerHandle: () => VideoPlayerHandle | null;
  getSubtitleLine: (id: number) => SubtitleLine | undefined;
  setActiveSubtitleLineId: (id: number | null) => void;
  setTempSubtitleLine: (line: TempSubtitleLine | null) => void;
}

interface UseSubtitlePlaybackSelectionResult {
  pauseAtTime: number | null;
  playTimeSpan: (start: number, end: number) => void;
  playEdge: (start: number, end: number, side: 'start' | 'end', maxSpan?: number) => void;
  playUpdatedSpan: (oldStart: number, oldEnd: number, newStart: number, newEnd: number) => void;
  handleSeek: (time: number) => void;
  handleSubtitleLineClicked: (id: number) => void;
  handleTempSubtitleLineCreated: (start: number, end: number) => void;
  clearPauseAtTime: () => void;
  resetPlaybackSelectionState: () => void;
}

export const useSubtitlePlaybackSelection = ({
  getVideoPlayerHandle,
  getSubtitleLine,
  setActiveSubtitleLineId,
  setTempSubtitleLine,
}: UseSubtitlePlaybackSelectionOptions): UseSubtitlePlaybackSelectionResult => {
  const [pauseAtTime, setPauseAtTime] = useState<number | null>(null);

  const clearPauseAtTime = useCallback(() => {
    setPauseAtTime(null);
  }, []);

  const playTimeSpan = useCallback((start: number, end: number) => {
    const player = getVideoPlayerHandle();
    if (player === null) return;

    setPauseAtTime(end);
    player.seekTo(start);
    player.play();
  }, [getVideoPlayerHandle]);

  const playEdge = useCallback((start: number, end: number, side: 'start' | 'end', maxSpan?: number) => {
    let duration = end - start;
    const effectiveMaxSpan = maxSpan ?? 1;

    if (duration > effectiveMaxSpan) {
      duration = effectiveMaxSpan;
    }
    if (duration <= 0) return;

    if (side === 'start') {
      playTimeSpan(start, start + duration);
    } else {
      playTimeSpan(end - duration, end);
    }
  }, [playTimeSpan]);

  const playUpdatedSpan = useCallback((oldStart: number, oldEnd: number, newStart: number, newEnd: number) => {
    const startChanged = Math.abs(newStart - oldStart) > 0.05;
    const endChanged = Math.abs(newEnd - oldEnd) > 0.05;

    if (startChanged) {
      playTimeSpan(newStart, newEnd);
    } else if (endChanged) {
      playEdge(newStart, newEnd, 'end');
    }
  }, [playEdge, playTimeSpan]);

  const handleSeek = useCallback((time: number) => {
    setPauseAtTime(null);
    getVideoPlayerHandle()?.seekTo(time);
  }, [getVideoPlayerHandle]);

  const handleSubtitleLineClicked = useCallback((id: number) => {
    const subtitleLine = getSubtitleLine(id);
    if (!subtitleLine) return;
    if (!getVideoPlayerHandle()) return;

    setTempSubtitleLine(null);
    setActiveSubtitleLineId(id);
    playTimeSpan(subtitleLine.startTime, subtitleLine.endTime);
  }, [getSubtitleLine, getVideoPlayerHandle, playTimeSpan, setActiveSubtitleLineId, setTempSubtitleLine]);

  const handleTempSubtitleLineCreated = useCallback((start: number, end: number) => {
    setActiveSubtitleLineId(null);
    setTempSubtitleLine({ start, end });
    playTimeSpan(start, end);
  }, [playTimeSpan, setActiveSubtitleLineId, setTempSubtitleLine]);

  const resetPlaybackSelectionState = useCallback(() => {
    setPauseAtTime(null);
  }, []);

  return {
    pauseAtTime,
    playTimeSpan,
    playEdge,
    playUpdatedSpan,
    handleSeek,
    handleSubtitleLineClicked,
    handleTempSubtitleLineCreated,
    clearPauseAtTime,
    resetPlaybackSelectionState,
  };
};

