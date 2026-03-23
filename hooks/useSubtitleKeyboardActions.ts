import { useCallback } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts.tsx';
import type { SubtitleLine } from '@/services/types.ts';
import type { VideoPlayerHandle } from '@/components/VideoPlayer.tsx';

/**
 * Domain workflow hook for subtitle keyboard interactions.
 *
 * Boundary:
 * - Encapsulates keyboard-driven subtitle behaviors (navigation/editing/playback/status transitions).
 * - Coordinates domain actions through injected callbacks.
 * - Leaves component-owned UI-only state decisions (modal/view rendering concerns) to the caller.
 */
interface UseSubtitleKeyboardActionsOptions {
  subtitleLines: SubtitleLine[];
  activeSubtitleLineId: number | null;
  currentTime: number;
  tempSubtitleLine: { start: number; end: number } | null;
  regionsHidden: boolean;
  isVideoOnly: boolean;
  getSubtitleLine: (id: number) => SubtitleLine | undefined;
  toggleSubtitleLineStatus: (id: number, order?: 'NLI') => void;
  removeSubtitle: (id: number) => void;
  breakUpSubtitleLine: (id: number) => void;
  mergeSubtitleLines: (ids: number[]) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
  handleCreateCard: (subtitleId: number) => Promise<void>;
  handleSubtitleLineClicked: (id: number) => void;
  playTimeSpan: (start: number, end: number) => void;
  playEdge: (start: number, end: number, side: 'start' | 'end', maxSpan?: number) => void;
  setActiveSubtitleLineId: (id: number | null) => void;
  setTempSubtitleLine: (line: { start: number; end: number } | null) => void;
  setRegionsHidden: (value: boolean) => void;
  setIsVideoOnlyMode: (value: boolean) => void;
  setIsShortcutsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  getVideoPlayerHandle: () => VideoPlayerHandle | null;
}

export const useSubtitleKeyboardActions = ({
  subtitleLines,
  activeSubtitleLineId,
  currentTime,
  tempSubtitleLine,
  regionsHidden,
  isVideoOnly,
  getSubtitleLine,
  toggleSubtitleLineStatus,
  removeSubtitle,
  breakUpSubtitleLine,
  mergeSubtitleLines,
  canUndo,
  canRedo,
  undo,
  redo,
  handleCreateCard,
  handleSubtitleLineClicked,
  playTimeSpan,
  playEdge,
  setActiveSubtitleLineId,
  setTempSubtitleLine,
  setRegionsHidden,
  setIsVideoOnlyMode,
  setIsShortcutsModalOpen,
  setIsSettingsModalOpen,
  getVideoPlayerHandle,
}: UseSubtitleKeyboardActionsOptions) => {
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
    } else if (currentIndex === -1) {
      const revIndex = [...subtitleLines].reverse().findIndex(s => s.startTime < currentTime);
      nextIndex = revIndex === -1 ? 0 : subtitleLines.length - 1 - revIndex;
    } else {
      nextIndex = Math.max(0, currentIndex - 1);
    }

    const sub = subtitleLines[nextIndex];
    if (!sub) return;

    setActiveSubtitleLineId(sub.id);
    playTimeSpan(sub.startTime, sub.endTime);
  }, [activeSubtitleLineId, currentTime, playTimeSpan, setActiveSubtitleLineId, subtitleLines]);

  const handleUndo = useCallback(() => {
    if (canUndo()) {
      undo();
    }
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (canRedo()) {
      redo();
    }
  }, [canRedo, redo]);

  const handleBreakUp = useCallback(() => {
    if (activeSubtitleLineId !== null) {
      breakUpSubtitleLine(activeSubtitleLineId);
    }
  }, [activeSubtitleLineId, breakUpSubtitleLine]);

  const handleMergeWithNext = useCallback(() => {
    if (activeSubtitleLineId === null) return;
    const currentLine = getSubtitleLine(activeSubtitleLineId);
    if (!currentLine) return;
    const nextLine = subtitleLines.find(s => s.startTime > currentLine.startTime);
    if (!nextLine) return;
    mergeSubtitleLines([activeSubtitleLineId, nextLine.id]);
  }, [activeSubtitleLineId, getSubtitleLine, mergeSubtitleLines, subtitleLines]);

  useKeyboardShortcuts({
    setActiveSubtitleLineId,
    onToggleRegionsHidden: () => {
      if (regionsHidden) {
        setRegionsHidden(false);
        return;
      }
      setActiveSubtitleLineId(null);
      setTempSubtitleLine(null);
      setRegionsHidden(true);
    },
    onToggleIsVideoOnlyMode: () => {
      if (isVideoOnly) {
        setIsVideoOnlyMode(false);
        return;
      }
      setActiveSubtitleLineId(null);
      setTempSubtitleLine(null);
      setIsVideoOnlyMode(true);
    },
    onReplay: () => {
      if (activeSubtitleLineId !== null) {
        handleSubtitleLineClicked(activeSubtitleLineId);
        return;
      }
      if (tempSubtitleLine !== null) {
        playTimeSpan(tempSubtitleLine.start, tempSubtitleLine.end);
        return;
      }
      getVideoPlayerHandle()?.playPause();
    },
    onPlay: () => {
      setActiveSubtitleLineId(null);
      setTempSubtitleLine(null);
      getVideoPlayerHandle()?.playPause();
    },
    onPlayHead: () => {
      if (activeSubtitleLineId !== null) {
        const sub = getSubtitleLine(activeSubtitleLineId);
        if (!sub) return;
        if (!getVideoPlayerHandle()) return;
        playEdge(sub.startTime, sub.endTime, 'start');
        return;
      }
      if (tempSubtitleLine !== null) {
        playEdge(tempSubtitleLine.start, tempSubtitleLine.end, 'start');
      }
    },
    onPlayTail: () => {
      if (activeSubtitleLineId !== null) {
        const sub = getSubtitleLine(activeSubtitleLineId);
        if (!sub) return;
        if (!getVideoPlayerHandle()) return;
        playEdge(sub.startTime, sub.endTime, 'end');
        return;
      }
      if (tempSubtitleLine !== null) {
        playEdge(tempSubtitleLine.start, tempSubtitleLine.end, 'end');
      }
    },
    onCreateCard: async () => {
      if (activeSubtitleLineId === null) return;
      await handleCreateCard(activeSubtitleLineId);
    },
    onJumpNext: () => jumpToSubtitleLine('next'),
    onJumpPrev: () => jumpToSubtitleLine('prev'),
    onToggleStatusOfActiveSubtitleLine: (order: 'forward' | 'backward') => {
      if (activeSubtitleLineId === null) return;
      if (order === 'forward') {
        toggleSubtitleLineStatus(activeSubtitleLineId);
      } else {
        toggleSubtitleLineStatus(activeSubtitleLineId, 'NLI');
      }
    },
    onDeleteActiveSubtitleLine: () => {
      if (activeSubtitleLineId === null) return;
      removeSubtitle(activeSubtitleLineId);
      setActiveSubtitleLineId(null);
    },
    onOpenOrCloseShortcutsModal: () => setIsShortcutsModalOpen(prev => !prev),
    onOpenOrCloseSettings: () => setIsSettingsModalOpen(prev => !prev),
    onBreakUp: handleBreakUp,
    onMergeWithNext: handleMergeWithNext,
    onRedo: handleRedo,
    onUndo: handleUndo,
  });
};
