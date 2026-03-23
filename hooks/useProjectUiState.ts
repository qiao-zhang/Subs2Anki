import { useCallback, useState } from 'react';
import type { AnkiCard } from '@/services/types.ts';

interface UseProjectUiStateResult {
  isVideoReady: boolean;
  setIsVideoReady: (value: boolean) => void;
  regionsHidden: boolean;
  setRegionsHidden: (value: boolean) => void;
  isVideoOnly: boolean;
  setIsVideoOnlyMode: (value: boolean) => void;
  isTemplateModalOpen: boolean;
  setIsTemplateModalOpen: (value: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (value: boolean) => void;
  previewCard: AnkiCard | null;
  setPreviewCard: (card: AnkiCard | null) => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (value: boolean) => void;
  resetViewModes: () => void;
  closeTransientUi: () => void;
}

export const useProjectUiState = (): UseProjectUiStateResult => {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [regionsHidden, setRegionsHidden] = useState(false);
  const [isVideoOnly, setIsVideoOnlyMode] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState<AnkiCard | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  const resetViewModes = useCallback(() => {
    setRegionsHidden(false);
    setIsVideoOnlyMode(false);
  }, []);

  const closeTransientUi = useCallback(() => {
    setIsTemplateModalOpen(false);
    setIsSettingsModalOpen(false);
    setPreviewCard(null);
    setIsShortcutsModalOpen(false);
  }, []);

  return {
    isVideoReady,
    setIsVideoReady,
    regionsHidden,
    setRegionsHidden,
    isVideoOnly,
    setIsVideoOnlyMode,
    isTemplateModalOpen,
    setIsTemplateModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    previewCard,
    setPreviewCard,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    resetViewModes,
    closeTransientUi,
  };
};

