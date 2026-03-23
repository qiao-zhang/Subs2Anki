import { useTranslation } from 'react-i18next';
import type { AnkiCard } from '@/services/types.ts';
import type { SubtitleLine } from '@/services/types.ts';

interface UseProjectResetOptions {
  ankiCards: AnkiCard[];
  setProjectName: (name: string) => void;
  resetVideo: () => void;
  setSubtitles: (lines: SubtitleLine[], fileName: string, fileHandle?: BrowserFileHandle | null, subtitlePath?: string | null) => void;
  setHasUnsavedChanges: (value: boolean) => void;
  clearCards: () => void;
  setSelectedDeck: (deck: string) => void;
  setGlobalTags: (tags: string[]) => void;
  deleteScreenshotAndAudioForCard: (id: string) => Promise<void>;
  resetUiState: () => void;
  resetProcessingState: () => void;
  resetVideoPlayerState: () => void;
  closeTransientUi: () => void;
  showNotification: (text: string) => void;
  reloadPage?: () => void;
}

interface UseProjectResetResult {
  handleResetProject: () => void;
}

export const useProjectReset = ({
  ankiCards,
  setProjectName,
  resetVideo,
  setSubtitles,
  setHasUnsavedChanges,
  clearCards,
  setSelectedDeck,
  setGlobalTags,
  deleteScreenshotAndAudioForCard,
  resetUiState,
  resetProcessingState,
  resetVideoPlayerState,
  closeTransientUi,
  showNotification,
  reloadPage = () => window.location.reload(),
}: UseProjectResetOptions): UseProjectResetResult => {
  const { t } = useTranslation();

  const handleResetProject = () => {
    setProjectName('');
    resetVideo();
    setSubtitles([], '', null, null);
    setHasUnsavedChanges(false);

    resetUiState();
    resetProcessingState();
    resetVideoPlayerState();

    ankiCards.forEach(async card => await deleteScreenshotAndAudioForCard(card.id));
    clearCards();

    setSelectedDeck('Subs2Anki Export');
    setGlobalTags([]);
    closeTransientUi();

    reloadPage();

    showNotification(t('notifications.projectReset', {
      defaultValue: 'Project has been reset',
    }));
  };

  return {
    handleResetProject,
  };
};

