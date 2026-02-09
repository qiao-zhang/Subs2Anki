import {useEffect} from 'react';

interface KeyboardShortcutsOptions {
  setActiveSubtitleLineId: (id: number | null) => void;
  setTempSubtitleLine: (line: { start: number; end: number } | null) => void;
  onToggleRegionsHidden: () => void;
  onToggleIsVideoOnlyMode: () => void;
  onPlay: () => void;
  onReplay: () => void;
  onCreateCard: () => void;
  onJumpNext: () => void;
  onJumpPrev: () => void;
  onToggleStatusOfActiveSubtitleLine: () => void;
  onOpenOrCloseShortcutsModal: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export const useMergeKeyboardShortcut = (onMerge: () => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        onMerge();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMerge]);
}

export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions) => {
  const {
    setActiveSubtitleLineId,
    setTempSubtitleLine,
    onToggleRegionsHidden,
    onToggleIsVideoOnlyMode,
    onPlay,
    onReplay,
    onCreateCard,
    onJumpNext,
    onJumpPrev,
    onToggleStatusOfActiveSubtitleLine,
    onOpenOrCloseShortcutsModal,
    onUndo,
    onRedo,
  } = options;

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
        case 'KeyU':
          e.preventDefault();
          onUndo();
          return;
        case 'Space':
          e.preventDefault();
          onReplay();
          return;
        case 'KeyP':
          e.preventDefault();
          onPlay();
          break;
        case 'Slash':
          e.preventDefault();
          onOpenOrCloseShortcutsModal();
          break;
        // case 'KeyH':
        // case 'KeyL':
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
        case 'KeyC':
          e.preventDefault();
          onCreateCard();
          break;
        case 'KeyH':
          e.preventDefault();
          onToggleRegionsHidden();
          break;
        case 'KeyV':
          e.preventDefault();
          onToggleIsVideoOnlyMode();
          break;
        case 'KeyI':
          e.preventDefault();
          onToggleStatusOfActiveSubtitleLine();
          break;
          /*
        case 'KeyN':
          e.preventDefault();
          onBreakUp();
          break;
           */
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setActiveSubtitleLineId,
    setTempSubtitleLine,
    onToggleRegionsHidden,
    onToggleIsVideoOnlyMode,
    onReplay,
    onCreateCard,
    onJumpNext,
    onJumpPrev,
    onToggleStatusOfActiveSubtitleLine,
    onOpenOrCloseShortcutsModal,
    onUndo,
    onRedo,
  ]);
};