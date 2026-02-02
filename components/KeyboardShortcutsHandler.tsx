import React, { useEffect } from 'react';
import { useAppStore } from '@/services/store.ts';

interface KeyboardShortcutsHandlerProps {
  activeSubtitleLineId: number | null;
  tempSubtitleLine: { start: number, end: number } | null;
  regionsHidden: boolean;
  isVideoOnly: boolean;
  setActiveSubtitleLineId: (id: number | null) => void;
  setTempSubtitleLine: (line: { start: number, end: number } | null) => void;
  toggleRegionsHidden: () => void;
  setIsVideoOnlyMode: (mode: boolean) => void;
  onReplayPressed: (id: number) => void;
  onCreateCard: () => void;
  onJumpNext: () => void;
  onJumpPrev: () => void;
  onJumpNextCard: () => void;
  onJumpPrevCard: () => void;
  // onToggleLock: () => void;
  // onShiftSubtitles: (offset: number) => void;
  onOpenOrCloseShortcutsModal: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

const KeyboardShortcutsHandler: React.FC<KeyboardShortcutsHandlerProps> = ({
  activeSubtitleLineId,
  tempSubtitleLine,
  regionsHidden,
  isVideoOnly,
  setActiveSubtitleLineId,
  setTempSubtitleLine,
  toggleRegionsHidden,
  setIsVideoOnlyMode,
  onReplayPressed,
  onCreateCard,
  onJumpNext,
  onJumpPrev,
  onJumpNextCard,
  onJumpPrevCard,
  onOpenOrCloseShortcutsModal,
  onUndo,
  onRedo
}) => {
  const { subtitleLines } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      // 处理 Ctrl+Z (Undo) 和 Ctrl+Y/Shift+Ctrl+Z (Redo)
      if (e.ctrlKey && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            // Ctrl+Shift+Z 或 Ctrl+Y 用于 Redo
            onRedo();
          } else {
            // Ctrl+Z 用于 Undo
            onUndo();
          }
          return;
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          // Ctrl+Y 用于 Redo
          onRedo();
          return;
        }
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          const videoPlayer = document.querySelector('#video-player') as HTMLVideoElement;
          if (videoPlayer) {
            if (videoPlayer.paused) {
              videoPlayer.play().then();
            } else {
              videoPlayer.pause();
            }
          }
          break;
        case 'KeyH':
          e.preventDefault();
          if (e.shiftKey) {
            onOpenOrCloseShortcutsModal();
            break;
          }
        /* fallthrough */
        case 'ArrowLeft':
          e.preventDefault();
          if (document.querySelector('#video-player')) {
            let d = 0.5;
            if (e.shiftKey) {
              d = 5;
            }
            if (e.ctrlKey) {
              d = 0.1;
            }
            const videoPlayer = document.querySelector('#video-player') as HTMLVideoElement;
            if (videoPlayer) {
              videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - d);
            }
          }
          break;
        case 'ArrowRight':
        case 'KeyL':
          e.preventDefault();
          if (document.querySelector('#video-player')) {
            let d = 0.5;
            if (e.shiftKey) {
              d = 5;
            }
            if (e.ctrlKey) {
              d = 0.1;
            }
            const videoPlayer = document.querySelector('#video-player') as HTMLVideoElement;
            if (videoPlayer) {
              videoPlayer.currentTime = videoPlayer.currentTime + d;
            }
          }
          break;
        case 'ArrowUp':
        case 'KeyK':
          e.preventDefault();
          onJumpPrev();
          break;
        case 'ArrowDown':
        case 'KeyJ':
          e.preventDefault();
          onJumpNext();
          break;
        case 'KeyR':
          e.preventDefault();
          if (activeSubtitleLineId) onReplayPressed(activeSubtitleLineId);
          break;
        case 'KeyC':
          e.preventDefault();
          onCreateCard();
          break;
        case 'KeyN':
          e.preventDefault();
          setActiveSubtitleLineId(null);
          setTempSubtitleLine(null);
          toggleRegionsHidden();
          break;
        case 'KeyV':
          e.preventDefault();
          setIsVideoOnlyMode(!isVideoOnly); // 切换全屏模式
          break;
          /*
        case 'KeyT':
          e.preventDefault();
          onToggleLock();
          break;
        case 'KeyU':
          e.preventDefault();
          // Shift+U 用于快速向前移动字幕 100ms
          if (e.shiftKey) {
            onShiftSubtitles(0.1);
          } else {
            // U 键用于快速向后移动字幕 100ms
            onShiftSubtitles(-0.1);
          }
          break;
           */
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeSubtitleLineId,
    tempSubtitleLine,
    regionsHidden,
    isVideoOnly,
    setActiveSubtitleLineId,
    setTempSubtitleLine,
    toggleRegionsHidden,
    setIsVideoOnlyMode,
    onReplayPressed,
    onCreateCard,
    onJumpNext,
    onJumpPrev,
    onJumpNextCard,
    onJumpPrevCard,
    // onToggleLock,
    // onShiftSubtitles,
    onOpenOrCloseShortcutsModal,
    onUndo,
    onRedo,
    subtitleLines
  ]);

  return null; // This component doesn't render anything
};

export default KeyboardShortcutsHandler;