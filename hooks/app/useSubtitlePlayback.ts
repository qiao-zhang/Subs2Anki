import {MutableRefObject, useCallback, useState} from 'react';
import {SubtitleLine} from '@/services/types.ts';
import {VideoPlayerHandle} from '@/components/VideoPlayer.tsx';

interface UseSubtitlePlaybackParams {
  subtitleLines: SubtitleLine[];
  getSubtitleLine: (id: number) => SubtitleLine | null;
  updateSubtitleTime: (id: number, start: number, end: number) => void;
  addSubtitleLine: (line: SubtitleLine) => void;
  videoPlayerRef: MutableRefObject<VideoPlayerHandle | null>;
}

export const useSubtitlePlayback = ({
  subtitleLines,
  getSubtitleLine,
  updateSubtitleTime,
  addSubtitleLine,
  videoPlayerRef,
}: UseSubtitlePlaybackParams) => {
  const [pauseAtTime, setPauseAtTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeSubtitleLineId, setActiveSubtitleLineId] = useState<number | null>(null);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');
  const [tempSubtitleLine, setTempSubtitleLine] = useState<{ start: number, end: number } | null>(null);

  const playTimeSpan = useCallback((start: number, end: number) => {
    if (videoPlayerRef.current === null) return;
    setPauseAtTime(end);
    videoPlayerRef.current.seekTo(start);
    videoPlayerRef.current.play();
  }, [videoPlayerRef]);

  const playEdge = useCallback((start: number, end: number, side: 'start' | 'end', maxSpan = 1) => {
    let duration = end - start;
    if (duration > maxSpan) {
      duration = maxSpan;
    }
    if (duration <= 0) return;
    if (side === 'start') {
      playTimeSpan(start, start + duration);
      return;
    }
    playTimeSpan(end - duration, end);
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

  const jumpToSubtitleLine = useCallback((direction: 'next' | 'prev') => {
    if (subtitleLines.length === 0) return;

    let nextIndex: number;
    const currentIndex = subtitleLines.findIndex(s => s.id === activeSubtitleLineId);

    if (direction === 'next') {
      if (currentIndex === -1) {
        nextIndex = subtitleLines.findIndex(s => s.startTime > currentTime);
        if (nextIndex === -1) nextIndex = 0;
      } else {
        nextIndex = Math.min(subtitleLines.length - 1, currentIndex + 1);
      }
    } else {
      if (currentIndex === -1) {
        const revIndex = [...subtitleLines].reverse().findIndex(s => s.startTime < currentTime);
        nextIndex = revIndex === -1 ? 0 : subtitleLines.length - 1 - revIndex;
      } else {
        nextIndex = Math.max(0, currentIndex - 1);
      }
    }

    const sub = subtitleLines[nextIndex];
    if (sub) {
      setActiveSubtitleLineId(sub.id);
      playTimeSpan(sub.startTime, sub.endTime);
    }
  }, [activeSubtitleLineId, currentTime, playTimeSpan, subtitleLines]);

  const handleTempSubtitleLineCreated = useCallback((start: number, end: number) => {
    setActiveSubtitleLineId(null);
    setTempSubtitleLine({start, end});
    playTimeSpan(start, end);
  }, [playTimeSpan]);

  const handleTempSubtitleLineUpdated = useCallback((start: number, end: number, side?: 'start' | 'end') => {
    setActiveSubtitleLineId(null);
    setTempSubtitleLine({start, end});
    if (side && side === 'end') {
      playEdge(start, end, side);
      return;
    }
    playTimeSpan(start, end);
  }, [playEdge, playTimeSpan]);

  const handleTempSubtitleLineRemoved = useCallback(() => {
    setTempSubtitleLine(null);
  }, []);

  const handleTempSubtitleLineClicked = useCallback((start: number, end: number) => {
    setActiveSubtitleLineId(null);
    playTimeSpan(start, end);
  }, [playTimeSpan]);

  const handleCommitTempSubtitleLine = useCallback((text: string) => {
    if (!tempSubtitleLine) return;
    const maxId = subtitleLines.reduce((max, s) => Math.max(max, s.id), 0);
    addSubtitleLine({
      id: maxId + 1,
      startTime: tempSubtitleLine.start,
      endTime: tempSubtitleLine.end,
      text,
      status: 'normal',
    });
    setTempSubtitleLine(null);
  }, [addSubtitleLine, subtitleLines, tempSubtitleLine]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);

    if (pauseAtTime !== null && time >= pauseAtTime) {
      videoPlayerRef.current?.pause();
      videoPlayerRef.current?.seekTo(pauseAtTime);
      setPauseAtTime(null);
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
    } else if (active && active.id === activeSubtitleLineId) {
      setCurrentSubtitleText(active.text);
    }
  }, [activeSubtitleLineId, pauseAtTime, subtitleLines, videoPlayerRef]);

  const handleSeek = useCallback((time: number) => {
    setPauseAtTime(null);
    videoPlayerRef.current?.seekTo(time);
  }, [videoPlayerRef]);

  const handleSubtitleLineClicked = useCallback((id: number) => {
    const sub = getSubtitleLine(id);
    if (!sub) return;
    if (!videoPlayerRef.current) return;
    setTempSubtitleLine(null);
    setActiveSubtitleLineId(id);
    playTimeSpan(sub.startTime, sub.endTime);
  }, [getSubtitleLine, playTimeSpan, videoPlayerRef]);

  const handleSubtitleLineUpdated = useCallback((id: number, start: number, end: number) => {
    const sub = getSubtitleLine(id);
    if (!sub) return;
    if (!videoPlayerRef.current) return;

    setTempSubtitleLine(null);
    setActiveSubtitleLineId(id);

    const {startTime: oldStart, endTime: oldEnd} = sub;
    updateSubtitleTime(id, start, end);
    playUpdatedSpan(oldStart, oldEnd, start, end);
  }, [getSubtitleLine, playUpdatedSpan, updateSubtitleTime, videoPlayerRef]);

  return {
    pauseAtTime,
    setPauseAtTime,
    currentTime,
    setCurrentTime,
    activeSubtitleLineId,
    setActiveSubtitleLineId,
    currentSubtitleText,
    setCurrentSubtitleText,
    tempSubtitleLine,
    setTempSubtitleLine,
    playTimeSpan,
    playEdge,
    jumpToSubtitleLine,
    handleTempSubtitleLineCreated,
    handleTempSubtitleLineUpdated,
    handleTempSubtitleLineRemoved,
    handleTempSubtitleLineClicked,
    handleCommitTempSubtitleLine,
    handleTimeUpdate,
    handleSeek,
    handleSubtitleLineClicked,
    handleSubtitleLineUpdated,
  };
};

