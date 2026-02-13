import {useEffect} from 'react';

export const useMergeKeyboardShortcut = (onMerge: () => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'KeyM' || e.code === 'KeyG') {
        e.preventDefault();
        onMerge();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMerge]);
}

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
  onToggleStatusOfActiveSubtitleLine: (order?: 'forward' | 'backward') => void;
  onDeleteActiveSubtitleLine: () => void;
  onOpenOrCloseShortcutsModal: () => void;
  onOpenOrCloseSettings: () => void;
  onBreakUp: () => void;
  onMergeWithNext: () => void;
  onUndo: () => void;
  onRedo: () => void;
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
    onDeleteActiveSubtitleLine,
    onOpenOrCloseShortcutsModal,
    onOpenOrCloseSettings,
    onBreakUp,
    onMergeWithNext,
    onUndo,
    onRedo,
  } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.code) {
        case 'KeyX':
        case 'Comma':
          e.preventDefault();
          onDeleteActiveSubtitleLine();
          return;
        case 'KeyR':
        case 'KeyY':
          e.preventDefault();
          onRedo();
          return;
        case 'KeyU':
        case 'KeyZ':
          e.preventDefault();
          onUndo();
          return;
        case 'Space':
          e.preventDefault();
          onReplay();
          return;
        case 'KeyP':
        case 'KeyQ':
          e.preventDefault();
          onPlay();
          break;
        case 'Slash':
        case 'Tab':
          e.preventDefault();
          onOpenOrCloseShortcutsModal();
          break;
        case 'KeyD':
        case 'KeyJ':
          e.preventDefault();
          onJumpPrev();
          break;
        case 'KeyK':
        case 'KeyF':
          e.preventDefault();
          onJumpNext();
          break;
        case 'KeyN':
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
        case 'KeyE':
          e.preventDefault();
          onToggleStatusOfActiveSubtitleLine('forward');
          break;
        case 'KeyO':
        case 'KeyW':
          e.preventDefault();
          onToggleStatusOfActiveSubtitleLine('backward');
          return;
        case 'KeyB':
        case 'KeyS':
          e.preventDefault();
          onBreakUp();
          break;
        case 'KeyA':
        case 'Semicolon':
          e.preventDefault();
          onMergeWithNext();
          break;
        case 'Escape':
        case 'Period':
          e.preventDefault();
          onOpenOrCloseSettings();
          break;
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
    onDeleteActiveSubtitleLine,
    onOpenOrCloseShortcutsModal,
    onOpenOrCloseSettings,
    onBreakUp,
    onUndo,
    onRedo,
  ]);
};