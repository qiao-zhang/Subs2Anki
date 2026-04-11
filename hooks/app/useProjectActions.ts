import React from 'react';
import {AnkiNoteType, SubtitleLine} from '@/services/types.ts';
import {
  createProjectRecord,
  loadProjectRecord,
  loadProjectRecordViaTauri,
  saveProjectRecord,
  saveProjectRecordViaTauri,
} from '@/services/project-record.ts';
import {isTauriRuntime} from '@/services/tauri-runtime.ts';

interface UseProjectActionsParams {
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
  screenshotTimingPercent: number;

  setProjectName: (name: string) => void;
  setSubtitles: (lines: SubtitleLine[], fileName: string) => void;
  setAnkiConfig: (config: AnkiNoteType) => void;
  setAnkiConnectUrl: (url: string) => void;
  setSelectedDeck: (deck: string) => void;
  setGlobalTags: (tags: string[]) => void;
  setBulkCreateLimit: (limit: number) => void;
  setAutoDeleteSynced: (enabled: boolean) => void;
  setShowBulkCreateButton: (show: boolean) => void;
  setScreenshotTimingPercent: (percent: number) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;

  showNotification: (text: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;

  createProjectRecordFn?: typeof createProjectRecord;
  saveProjectRecordFn?: typeof saveProjectRecord;
  loadProjectRecordFn?: typeof loadProjectRecord;
  saveProjectRecordViaTauriFn?: typeof saveProjectRecordViaTauri;
  loadProjectRecordViaTauriFn?: typeof loadProjectRecordViaTauri;

  resetStoreState: () => void;
}

export const useProjectActions = ({
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
  screenshotTimingPercent,
  setProjectName,
  setSubtitles,
  setAnkiConfig,
  setAnkiConnectUrl,
  setSelectedDeck,
  setGlobalTags,
  setBulkCreateLimit,
  setAutoDeleteSynced,
  setShowBulkCreateButton,
  setScreenshotTimingPercent,
  setHasUnsavedChanges,
  showNotification,
  t,
  createProjectRecordFn = createProjectRecord,
  saveProjectRecordFn = saveProjectRecord,
  loadProjectRecordFn = loadProjectRecord,
  saveProjectRecordViaTauriFn = saveProjectRecordViaTauri,
  loadProjectRecordViaTauriFn = loadProjectRecordViaTauri,
  resetStoreState,
}: UseProjectActionsParams) => {
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

      const record = createProjectRecordFn(
        appState,
        selectedDeck,
        globalTags,
        bulkCreateLimit,
        autoDeleteSynced,
        showBulkCreateButton,
        audioVolume,
        screenshotTimingPercent,
      );

      if (isTauriRuntime()) {
        const saved = await saveProjectRecordViaTauriFn(record);
        if (!saved) return;
      } else {
        await saveProjectRecordFn(record);
      }

      showNotification(t('notifications.projectSaved', {defaultValue: 'Project saved successfully!'}));
    } catch (error) {
      console.error('Failed to save project:', error);
      alert(`Failed to save project: ${(error as Error).message}`);
    }
  };

  const handleLoadProject = async (event?: React.ChangeEvent<HTMLInputElement>) => {
    let record;

    try {
      if (isTauriRuntime()) {
        const selectedRecord = await loadProjectRecordViaTauriFn();
        if (!selectedRecord) return;
        record = selectedRecord;
      } else {
        const file = event?.target.files?.[0];
        if (!file) return;
        record = await loadProjectRecordFn(file);
      }

      setProjectName(record.projectName);
      setSubtitles(record.subtitleLines, record.subtitleFileName);
      setAnkiConfig(record.ankiConfig);
      setAnkiConnectUrl(record.ankiConnectUrl);

      if (record.selectedDeck) {
        setSelectedDeck(record.selectedDeck);
      } else {
        const defaultDeckName = record.projectName ? `Subs2Anki::${record.projectName}` : 'Subs2Anki Export';
        setSelectedDeck(defaultDeckName);
      }

      if (record.globalTags) {
        setGlobalTags(record.globalTags);
      } else {
        setGlobalTags([]);
      }

      if (record.bulkCreateLimit !== undefined) {
        setBulkCreateLimit(record.bulkCreateLimit);
      }

      if (record.autoDeleteSynced !== undefined) {
        setAutoDeleteSynced(record.autoDeleteSynced);
      }

      if (record.showBulkCreateButton !== undefined) {
        setShowBulkCreateButton(record.showBulkCreateButton);
      }

      if (record.screenshotTimingPercent !== undefined) {
        setScreenshotTimingPercent(record.screenshotTimingPercent);
      } else {
        setScreenshotTimingPercent(50);
      }

      showNotification(t('notifications.projectLoaded', {
        defaultValue: 'Project loaded successfully!',
      }));
    } catch (error) {
      console.error('Failed to load project:', error);
      alert(`Failed to load project: ${(error as Error).message}`);
    }
  };

  const handleResetProject = () => {
    resetStoreState();
    setHasUnsavedChanges(false);
    window.location.reload();
    showNotification(t('notifications.projectReset', {
      defaultValue: 'Project has been reset',
    }));
  };

  return {
    handleSaveProject,
    handleLoadProject,
    handleResetProject,
  };
};



