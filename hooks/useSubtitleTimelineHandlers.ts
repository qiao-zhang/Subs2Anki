import { useCallback } from 'react';
import type { SubtitleLine } from '@/services/types.ts';
import type { VideoPlayerHandle } from '@/components/VideoPlayer.tsx';

interface UseSubtitleTimelineHandlersOptions {
  subtitleLines: SubtitleLine[];
  activeSubtitleLineId: number | null;
  tempSubtitleLine: { start: number; end: number } | null;
  pauseAtTime: number | null;
  getVideoPlayerHandle: () => VideoPlayerHandle | null;
  getSubtitleLine: (id: number) => SubtitleLine | null | undefined;
  playTimeSpan: (start: number, end: number) => void;
  playEdge: (start: number, end: number, side: 'start' | 'end', maxSpan?: number) => void;
  playUpdatedSpan: (oldStart: number, oldEnd: number, newStart: number, newEnd: number) => void;
  clearPauseAtTime: () => void;
  addSubtitleLine: (sub: SubtitleLine) => void;
  updateSubtitleTime: (id: number, start: number, end: number) => void;
  setCurrentTime: (time: number) => void;
  setActiveSubtitleLineId: (id: number | null) => void;
  setCurrentSubtitleText: (text: string) => void;
  setTempSubtitleLine: (line: { start: number; end: number } | null) => void;
  showNotification: (text: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

interface UseSubtitleTimelineHandlersResult {
  handleTempSubtitleLineUpdated: (start: number, end: number, side?: 'start' | 'end') => void;
  handleTempSubtitleLineRemoved: () => void;
  handleTempSubtitleLineClicked: (start: number, end: number) => void;
  handleCommitTempSubtitleLine: (text: string) => void;
  handleTimeUpdate: (time: number) => void;
  handleSubtitleLineShiftClicked: (id: number) => void;
  handleSubtitleLineUpdated: (id: number, start: number, end: number) => void;
}

export const useSubtitleTimelineHandlers = ({
  subtitleLines,
  activeSubtitleLineId,
  tempSubtitleLine,
  pauseAtTime,
  getVideoPlayerHandle,
  getSubtitleLine,
  playTimeSpan,
  playEdge,
  playUpdatedSpan,
  clearPauseAtTime,
  addSubtitleLine,
  updateSubtitleTime,
  setCurrentTime,
  setActiveSubtitleLineId,
  setCurrentSubtitleText,
  setTempSubtitleLine,
  showNotification,
  t,
}: UseSubtitleTimelineHandlersOptions): UseSubtitleTimelineHandlersResult => {
  const handleTempSubtitleLineUpdated = useCallback((start: number, end: number, side?: 'start' | 'end') => {
    setActiveSubtitleLineId(null);
    setTempSubtitleLine({ start, end });
    if (side === 'end') {
      playEdge(start, end, side);
      return;
    }
    playTimeSpan(start, end);
  }, [playEdge, playTimeSpan, setActiveSubtitleLineId, setTempSubtitleLine]);

  const handleTempSubtitleLineRemoved = useCallback(() => {
    setTempSubtitleLine(null);
  }, [setTempSubtitleLine]);

  const handleTempSubtitleLineClicked = useCallback((start: number, end: number) => {
    setActiveSubtitleLineId(null);
    playTimeSpan(start, end);
  }, [playTimeSpan, setActiveSubtitleLineId]);

  const handleCommitTempSubtitleLine = useCallback((text: string) => {
    if (!tempSubtitleLine) return;
    const maxId = subtitleLines.reduce((max, s) => Math.max(max, s.id), 0);
    const newSubLine: SubtitleLine = {
      id: maxId + 1,
      startTime: tempSubtitleLine.start,
      endTime: tempSubtitleLine.end,
      text,
      status: 'normal',
    };
    addSubtitleLine(newSubLine);
    setTempSubtitleLine(null);
  }, [addSubtitleLine, setTempSubtitleLine, subtitleLines, tempSubtitleLine]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);

    if (pauseAtTime !== null && time >= pauseAtTime) {
      getVideoPlayerHandle()?.pause();
      getVideoPlayerHandle()?.seekTo(pauseAtTime);
      clearPauseAtTime();
      return;
    }

    const activeIndex = subtitleLines.findIndex(s => time >= s.startTime && time <= s.endTime);
    const active = activeIndex !== -1 ? subtitleLines[activeIndex] : null;

    if (active && active.id !== activeSubtitleLineId) {
      setActiveSubtitleLineId(active.id);
      setCurrentSubtitleText(active.text);
    } else if (!active) {
      setActiveSubtitleLineId(null);
      setCurrentSubtitleText('');
    } else {
      setCurrentSubtitleText(active.text);
    }
  }, [
    activeSubtitleLineId,
    clearPauseAtTime,
    getVideoPlayerHandle,
    pauseAtTime,
    setActiveSubtitleLineId,
    setCurrentSubtitleText,
    setCurrentTime,
    subtitleLines,
  ]);

  const handleSubtitleLineShiftClicked = useCallback((id: number) => {
    const sub = getSubtitleLine(id);
    if (!sub) return;

    navigator.clipboard.writeText(sub.text).then(() => {
      showNotification(t('notifications.copiedToClipboard', {
        defaultValue: '"{{text}}" copied to clipboard',
        text: sub.text,
      }));
    }).catch(err => {
      console.debug('[useSubtitleTimelineHandlers] Failed to copy subtitle text', err);
    });
  }, [getSubtitleLine, showNotification, t]);

  const handleSubtitleLineUpdated = useCallback((id: number, start: number, end: number) => {
    const sub = getSubtitleLine(id);
    if (!sub) return;
    if (!getVideoPlayerHandle()) return;

    setTempSubtitleLine(null);
    setActiveSubtitleLineId(id);

    const { startTime: oldStart, endTime: oldEnd } = sub;
    updateSubtitleTime(id, start, end);
    playUpdatedSpan(oldStart, oldEnd, start, end);
  }, [getSubtitleLine, getVideoPlayerHandle, playUpdatedSpan, setActiveSubtitleLineId, setTempSubtitleLine, updateSubtitleTime]);

  return {
    handleTempSubtitleLineUpdated,
    handleTempSubtitleLineRemoved,
    handleTempSubtitleLineClicked,
    handleCommitTempSubtitleLine,
    handleTimeUpdate,
    handleSubtitleLineShiftClicked,
    handleSubtitleLineUpdated,
  };
};

