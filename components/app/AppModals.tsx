import React from 'react';
import {AnkiCard, AnkiNoteType} from '@/services/types.ts';
import TemplateEditorModal from '@/components/modals/TemplateEditorModal.tsx';
import SettingsModal from '@/components/modals/SettingsModal.tsx';
import CardPreviewModal from '@/components/modals/CardPreviewModal.tsx';
import ShortcutsCheatSheetModal from '@/components/modals/ShortcutsCheatSheetModal.tsx';

interface AppModalsProps {
  isTemplateModalOpen: boolean;
  onCloseTemplate: () => void;
  ankiConfig: AnkiNoteType;
  onSaveAnkiConfig: (config: AnkiNoteType) => void;

  isSettingsModalOpen: boolean;
  onCloseSettings: () => void;
  ankiConnectUrl: string;
  onSaveAnkiConnectUrl: (url: string) => void;
  autoDeleteSynced: boolean;
  onAutoDeleteSyncedChange: (enabled: boolean) => void;
  bulkCreateLimit: number;
  onBulkCreateLimitChange: (limit: number) => void;
  showBulkCreateButton: boolean;
  onShowBulkCreateButtonChange: (show: boolean) => void;
  audioVolume: number;
  onAudioVolumeChange: (volume: number) => void;
  onTestSuccess: () => Promise<void>;

  ankiCards: AnkiCard[];
  previewCard: AnkiCard | null;
  onClosePreview: () => void;

  isShortcutsModalOpen: boolean;
  onCloseShortcuts: () => void;
}

const AppModals: React.FC<AppModalsProps> = ({
  isTemplateModalOpen,
  onCloseTemplate,
  ankiConfig,
  onSaveAnkiConfig,
  isSettingsModalOpen,
  onCloseSettings,
  ankiConnectUrl,
  onSaveAnkiConnectUrl,
  autoDeleteSynced,
  onAutoDeleteSyncedChange,
  bulkCreateLimit,
  onBulkCreateLimitChange,
  showBulkCreateButton,
  onShowBulkCreateButtonChange,
  audioVolume,
  onAudioVolumeChange,
  onTestSuccess,
  ankiCards,
  previewCard,
  onClosePreview,
  isShortcutsModalOpen,
  onCloseShortcuts,
}) => {
  return (
    <>
      <TemplateEditorModal
        isOpen={isTemplateModalOpen}
        onClose={onCloseTemplate}
        config={ankiConfig}
        onSave={onSaveAnkiConfig}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={onCloseSettings}
        ankiConnectUrl={ankiConnectUrl}
        onSaveAnkiConnectUrl={onSaveAnkiConnectUrl}
        autoDeleteSynced={autoDeleteSynced}
        onAutoDeleteSyncedChange={onAutoDeleteSyncedChange}
        bulkCreateLimit={bulkCreateLimit}
        onBulkCreateLimitChange={onBulkCreateLimitChange}
        showBulkCreateButton={showBulkCreateButton}
        onShowBulkCreateButtonChange={onShowBulkCreateButtonChange}
        audioVolume={audioVolume}
        onAudioVolumeChange={onAudioVolumeChange}
        onTestSuccess={onTestSuccess}
      />
      <CardPreviewModal
        isOpen={!!previewCard}
        card={previewCard ? ankiCards.find(c => c.id === previewCard.id) || previewCard : null}
        onClose={onClosePreview}
      />
      <ShortcutsCheatSheetModal
        isOpen={isShortcutsModalOpen}
        onClose={onCloseShortcuts}
      />
    </>
  );
};

export default AppModals;

