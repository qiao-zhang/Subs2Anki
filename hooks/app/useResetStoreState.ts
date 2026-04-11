import {MutableRefObject, useCallback} from 'react';
import {VideoPlayerHandle} from '@/components/VideoPlayer.tsx';
import {AnkiCard} from '@/services/types.ts';

interface UseResetStoreStateParams {
  ankiCards: AnkiCard[];
  clearCards: () => void;
  deleteScreenshotAndAudioForCard: (id: string) => Promise<void>;
  resetVideo: () => void;
  setProjectName: (name: string) => void;
  setSubtitles: (lines: any[], fileName: string) => void;
  setPauseAtTime: (time: number | null) => void;
  setActiveSubtitleLineId: (id: number | null) => void;
  setTempSubtitleLine: (line: { start: number; end: number } | null) => void;
  setIsExporting: (isExporting: boolean) => void;
  setRegionsHidden: (hidden: boolean) => void;
  setIsVideoOnlyMode: (isVideoOnly: boolean) => void;
  setSelectedDeck: (deckName: string) => void;
  setGlobalTags: (tags: string[]) => void;
  setIsTemplateModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  setPreviewCard: (card: AnkiCard | null) => void;
  setIsShortcutsModalOpen: (open: boolean) => void;
  videoPlayerRef: MutableRefObject<VideoPlayerHandle | null>;
}

export const useResetStoreState = ({
  ankiCards,
  clearCards,
  deleteScreenshotAndAudioForCard,
  resetVideo,
  setProjectName,
  setSubtitles,
  setPauseAtTime,
  setActiveSubtitleLineId,
  setTempSubtitleLine,
  setIsExporting,
  setRegionsHidden,
  setIsVideoOnlyMode,
  setSelectedDeck,
  setGlobalTags,
  setIsTemplateModalOpen,
  setIsSettingsModalOpen,
  setPreviewCard,
  setIsShortcutsModalOpen,
  videoPlayerRef,
}: UseResetStoreStateParams) => {
  return useCallback(() => {
    setProjectName('');
    resetVideo();
    setSubtitles([], '');

    setPauseAtTime(null);
    setActiveSubtitleLineId(null);
    setTempSubtitleLine(null);

    setIsExporting(false);

    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(0);
      videoPlayerRef.current = null;
    }

    setRegionsHidden(false);
    setIsVideoOnlyMode(false);

    ankiCards.forEach(async card => await deleteScreenshotAndAudioForCard(card.id));
    clearCards();

    setSelectedDeck('Subs2Anki Export');
    setGlobalTags([]);

    setIsTemplateModalOpen(false);
    setIsSettingsModalOpen(false);
    setPreviewCard(null);
    setIsShortcutsModalOpen(false);
  }, [
    ankiCards,
    clearCards,
    deleteScreenshotAndAudioForCard,
    resetVideo,
    setActiveSubtitleLineId,
    setGlobalTags,
    setIsExporting,
    setIsSettingsModalOpen,
    setIsShortcutsModalOpen,
    setIsTemplateModalOpen,
    setIsVideoOnlyMode,
    setPauseAtTime,
    setPreviewCard,
    setProjectName,
    setRegionsHidden,
    setSelectedDeck,
    setSubtitles,
    setTempSubtitleLine,
    videoPlayerRef,
  ]);
};

