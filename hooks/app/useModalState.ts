import {useState} from 'react';
import {AnkiCard} from '@/services/types.ts';

export const useModalState = () => {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [previewCard, setPreviewCard] = useState<AnkiCard | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  return {
    isTemplateModalOpen,
    setIsTemplateModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    previewCard,
    setPreviewCard,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
  };
};

