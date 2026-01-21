import { useEffect } from 'react';
import { useAppStore } from '@/core/store.ts';

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
  jumpToSubtitle: (direction: 'next' | 'prev') => void;
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
  jumpToSubtitle
}) => {
  const { subtitleLines } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          const videoPlayer = document.querySelector('#video-player') as HTMLVideoElement;
          if (videoPlayer) {
            if (videoPlayer.paused) {
              videoPlayer.play();
            } else {
              videoPlayer.pause();
            }
          }
          break;
        case 'KeyH':
          e.preventDefault();
          if (e.shiftKey) {
            // Toggle shortcuts modal - would need to be passed as prop
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
          jumpToSubtitle('prev');
          break;
        case 'ArrowDown':
        case 'KeyJ':
          e.preventDefault();
          jumpToSubtitle('next');
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
    jumpToSubtitle,
    subtitleLines
  ]);

  return null; // This component doesn't render anything
};

export default KeyboardShortcutsHandler;