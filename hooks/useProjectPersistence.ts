import type React from 'react';
import { useTranslation } from 'react-i18next';
import type { AnkiNoteType, SubtitleLine } from '@/services/types.ts';
import { createProjectRecord, loadProjectRecord, saveProjectRecord } from '@/services/project-record.ts';

interface UseProjectPersistenceOptions {
  projectName: string;
  videoName: string;
  subtitleFileName: string;
  subtitleLines: SubtitleLine[];
  ankiConfig: AnkiNoteType;
  ankiConnectUrl: string;
  selectedDeck: string;
  globalTags: string[];
  bulkCreateLimit: number;
  autoDeleteSynced: boolean;
  showBulkCreateButton: boolean;
  audioVolume: number;
  setProjectName: (name: string) => void;
  setSubtitles: (lines: SubtitleLine[], fileName: string, fileHandle?: BrowserFileHandle | null, subtitlePath?: string | null) => void;
  setAnkiConfig: (config: AnkiNoteType) => void;
  setAnkiConnectUrl: (url: string) => void;
  setSelectedDeck: (deck: string) => void;
  setGlobalTags: (tags: string[]) => void;
  setBulkCreateLimit: (limit: number) => void;
  setAutoDeleteSynced: (enabled: boolean) => void;
  setShowBulkCreateButton: (show: boolean) => void;
  setAudioVolume: (volume: number) => void;
  showNotification: (text: string) => void;
}

interface UseProjectPersistenceResult {
  handleSaveProject: () => Promise<void>;
  handleLoadProject: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const useProjectPersistence = ({
  projectName,
  videoName,
  subtitleFileName,
  subtitleLines,
  ankiConfig,
  ankiConnectUrl,
  selectedDeck,
  globalTags,
  bulkCreateLimit,
  autoDeleteSynced,
  showBulkCreateButton,
  audioVolume,
  setProjectName,
  setSubtitles,
  setAnkiConfig,
  setAnkiConnectUrl,
  setSelectedDeck,
  setGlobalTags,
  setBulkCreateLimit,
  setAutoDeleteSynced,
  setShowBulkCreateButton,
  setAudioVolume,
  showNotification,
}: UseProjectPersistenceOptions): UseProjectPersistenceResult => {
  const { t } = useTranslation();

  const handleSaveProject = async () => {
    try {
      const appState = {
        projectName,
        videoName,
        subtitleFileName,
        subtitleLines,
        ankiConfig,
        ankiConnectUrl,
      };

      const record = createProjectRecord(
        appState,
        selectedDeck,
        globalTags,
        bulkCreateLimit,
        autoDeleteSynced,
        showBulkCreateButton,
        audioVolume,
      );
      await saveProjectRecord(record);
      showNotification(t('notifications.projectSaved', { defaultValue: 'Project saved successfully!' }));
    } catch (error) {
      console.debug('[useProjectPersistence] Failed to save project', error);
      showNotification(t('notifications.projectSaveFailed', {
        defaultValue: 'Failed to save project: {{error}}',
        error: (error as Error).message,
      }));
    }
  };

  const handleLoadProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const record = await loadProjectRecord(file);

      setProjectName(record.projectName);
      setSubtitles(record.subtitleLines, record.subtitleFileName);
      setAnkiConfig(record.ankiConfig);
      setAnkiConnectUrl(record.ankiConnectUrl);
      setSelectedDeck(record.selectedDeck || (record.projectName ? `Subs2Anki::${record.projectName}` : 'Subs2Anki Export'));
      setGlobalTags(record.globalTags ?? []);

      if (record.bulkCreateLimit !== undefined) {
        setBulkCreateLimit(record.bulkCreateLimit);
      }
      if (record.autoDeleteSynced !== undefined) {
        setAutoDeleteSynced(record.autoDeleteSynced);
      }
      if (record.showBulkCreateButton !== undefined) {
        setShowBulkCreateButton(record.showBulkCreateButton);
      }
      if (record.audioVolume !== undefined) {
        setAudioVolume(record.audioVolume);
      }

      showNotification(t('notifications.projectLoaded', { defaultValue: 'Project loaded successfully!' }));
    } catch (error) {
      console.debug('[useProjectPersistence] Failed to load project', error);
      showNotification(t('notifications.projectLoadFailed', {
        defaultValue: 'Failed to load project: {{error}}',
        error: (error as Error).message,
      }));
    }
  };

  return {
    handleSaveProject,
    handleLoadProject,
  };
};

