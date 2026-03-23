import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import saveAs from 'file-saver';
import { serializeSubtitles } from '@/services/parser.ts';
import { generateAnkiDeck, isExportDeckError } from '@/services/export.ts';
import { ffmpegService } from '@/services/ffmpeg.ts';
import { makeMediaFileName, formatTimeForFilename } from '@/services/filename-utils.ts';
import type { AnkiCard, AnkiNoteType, SubtitleLine } from '@/services/types.ts';
import type { VideoPlayerHandle } from '@/components/VideoPlayer.tsx';

/**
 * Domain workflow hook for media and deck export actions.
 *
 * Boundary:
 * - Owns export/file-operation workflows (save/download/extract/export) and related error/concurrency handling.
 * - Uses injected app state and services as inputs/dependencies.
 * - Does not own purely presentational UI state (dialog visibility, page layout, visual mode toggles).
 */
interface UseMediaExportActionsOptions {
  subtitleFileName: string;
  subtitleLines: SubtitleLine[];
  subtitlePath: string | null;
  fileHandle: BrowserFileHandle | null;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  videoFile: File | null;
  videoPath: string | null;
  videoName: string;
  audioVolume: number;
  tempSubtitleLine: { start: number; end: number } | null;
  activeSubtitleLineId: number | null;
  ankiCards: AnkiCard[];
  globalTags: string[];
  projectName: string;
  ankiConfig: AnkiNoteType;
  ensureDesktopFfmpegReady: (showUi?: boolean) => boolean;
  getVideoPlayerHandle: () => VideoPlayerHandle | null;
  getSubtitleLine: (id: number) => SubtitleLine | null | undefined;
  showNotification: (message: string) => void;
}

interface UseMediaExportActionsResult {
  isExporting: boolean;
  handleCancelExport: () => void;
  handleSaveSubtitles: () => Promise<void>;
  handleDownloadSubtitles: () => Promise<void>;
  handleExportApkg: () => Promise<void>;
  handleCaptureFrame: () => Promise<void>;
  handleDownloadAudio: () => Promise<void>;
}

export const useMediaExportActions = ({
  subtitleFileName,
  subtitleLines,
  subtitlePath,
  fileHandle,
  setHasUnsavedChanges,
  videoFile,
  videoPath,
  videoName,
  audioVolume,
  tempSubtitleLine,
  activeSubtitleLineId,
  ankiCards,
  globalTags,
  projectName,
  ankiConfig,
  ensureDesktopFfmpegReady,
  getVideoPlayerHandle,
  getSubtitleLine,
  showNotification,
}: UseMediaExportActionsOptions): UseMediaExportActionsResult => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const exportInProgressRef = useRef(false);
  const isAbortError = useCallback((error: unknown): boolean => {
    if (error instanceof DOMException) {
      return error.name === 'AbortError';
    }
    if (error instanceof Error) {
      return error.name === 'AbortError';
    }
    return false;
  }, []);

  const writeToBrowserHandle = useCallback(async (handle: BrowserFileHandle, data: BrowserWritableContent) => {
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
  }, []);

  const saveWithBrowserPicker = useCallback(async (
    suggestedName: string,
    data: BrowserWritableContent,
    types?: BrowserFilePickerAcceptType[],
  ): Promise<boolean> => {
    if (!window.showSaveFilePicker) {
      return false;
    }

    const handle = await window.showSaveFilePicker({ suggestedName, types });
    await writeToBrowserHandle(handle, data);
    return true;
  }, [writeToBrowserHandle]);

  const handleSaveSubtitles = useCallback(async () => {
    if (!subtitleFileName) return;
    try {
      const isVtt = subtitleFileName.toLowerCase().endsWith('.vtt');
      const content = serializeSubtitles(subtitleLines, isVtt ? 'vtt' : 'srt');

      if (__TAURI_BUILD__ && subtitlePath) {
        await invoke('write_subtitle_file', { path: subtitlePath, content });
        setHasUnsavedChanges(false);
        return;
      }

      if (fileHandle) {
        await writeToBrowserHandle(fileHandle, content);
        setHasUnsavedChanges(false);
        return;
      }

      setHasUnsavedChanges(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      showNotification(`Failed to save subtitles: ${message}`);
    }
  }, [fileHandle, setHasUnsavedChanges, showNotification, subtitleFileName, subtitleLines, subtitlePath, writeToBrowserHandle]);

  const handleDownloadSubtitles = useCallback(async () => {
    if (!subtitleFileName) return;
    const isVtt = subtitleFileName.toLowerCase().endsWith('.vtt');
    const content = serializeSubtitles(subtitleLines, isVtt ? 'vtt' : 'srt');
    try {
      const savedByPicker = await saveWithBrowserPicker(
        subtitleFileName,
        content,
        [{ description: 'Subtitle File', accept: { 'text/plain': [isVtt ? '.vtt' : '.srt'] } }],
      );

      if (!savedByPicker) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, subtitleFileName);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      showNotification(`Failed to download subtitles: ${message}`);
    }
  }, [isAbortError, saveWithBrowserPicker, setHasUnsavedChanges, showNotification, subtitleFileName, subtitleLines]);

  const handleExportApkg = useCallback(async () => {
    if (exportInProgressRef.current) {
      showNotification(t('notifications.exportInProgress', { defaultValue: 'Export is already in progress.' }));
      return;
    }

    exportInProgressRef.current = true;
    setIsExporting(true);
    try {
      await generateAnkiDeck(ankiCards, globalTags, projectName, ankiConfig);
    } catch (err) {
      if (isExportDeckError(err)) {
        switch (err.code) {
          case 'NO_CARDS':
            showNotification(t('notifications.exportNoCards', { defaultValue: 'No cards to export.' }));
            break;
          case 'DATABASE_CREATION_FAILED':
            showNotification(t('notifications.exportDatabaseFailed', {
              defaultValue: 'Failed to create deck database. Please ensure your browser supports WASM.',
            }));
            break;
          case 'PACKAGE_GENERATION_FAILED':
            showNotification(t('notifications.exportPackageFailed', { defaultValue: 'Failed to package deck file.' }));
            break;
          default:
            showNotification(t('notifications.exportFailed', { defaultValue: 'Failed to export deck.' }));
            break;
        }
      } else {
        const message = err instanceof Error ? err.message : 'Unknown error';
        showNotification(t('notifications.exportFailedWithError', {
          defaultValue: 'Failed to export deck: {{error}}',
          error: message,
        }));
      }
    } finally {
      exportInProgressRef.current = false;
      setIsExporting(false);
    }
  }, [ankiCards, ankiConfig, globalTags, projectName, showNotification, t]);

  const handleCaptureFrame = useCallback(async () => {
    const player = getVideoPlayerHandle();
    if (!player) return;
    const dataUrl = await player.captureFrame();
    if (!dataUrl) return;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const currentTime = player.getCurrentTime() || 0;

    const currentSubtitle = subtitleLines.find(sub =>
      currentTime >= sub.startTime && currentTime <= sub.endTime
    );

    const timeStr = formatTimeForFilename(currentTime);
    const fileName = makeMediaFileName(videoName, '.jpg', timeStr, currentSubtitle ? currentSubtitle.text : '');

    try {
      const savedByPicker = await saveWithBrowserPicker(fileName, blob, [{
        description: 'Snapshot',
      }]);
      if (!savedByPicker) {
        saveAs(blob, fileName);
      }
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      showNotification(`Failed to capture frame: ${message}`);
    }
  }, [getVideoPlayerHandle, isAbortError, saveWithBrowserPicker, showNotification, subtitleLines, videoName]);

  const extractAudioSync = useCallback(async (start: number, end: number): Promise<Blob | null> => {
    if (!videoFile && !videoPath) return null;
    if (!ensureDesktopFfmpegReady()) return null;
    try {
      getVideoPlayerHandle()?.pause();
      return await ffmpegService.extractAudioClip({ file: videoFile, path: videoPath }, start, end, audioVolume);
    } catch (e) {
      console.debug('[useMediaExportActions] Audio extraction failed', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      showNotification(`Audio extraction failed: ${message}`);
      return null;
    }
  }, [audioVolume, ensureDesktopFfmpegReady, getVideoPlayerHandle, showNotification, videoFile, videoPath]);

  const handleDownloadAudio = useCallback(async () => {
    if (!videoFile && !videoPath) return;
    if (!ensureDesktopFfmpegReady()) return;
    if (tempSubtitleLine === null && activeSubtitleLineId === null) return;
    let start: number;
    let end: number;
    let currentSub: SubtitleLine | null | undefined;

    if (tempSubtitleLine !== null) {
      start = tempSubtitleLine.start;
      end = tempSubtitleLine.end;
    } else {
      currentSub = getSubtitleLine(activeSubtitleLineId);
      if (currentSub == null) return;
      start = currentSub.startTime;
      end = currentSub.endTime;
    }

    const blob = await extractAudioSync(start, end);
    if (!blob) return;
    const startStr = formatTimeForFilename(start);
    const endStr = formatTimeForFilename(end);
    const filename = makeMediaFileName(videoName, '.wav', `${startStr}_${endStr}`, currentSub ? currentSub.text : '');

    try {
      const savedByPicker = await saveWithBrowserPicker(filename, blob, [{
        description: 'Audio File',
      }]);
      if (!savedByPicker) {
        saveAs(blob, filename);
      }
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      showNotification(`Failed to download audio: ${message}`);
    }
  }, [
    activeSubtitleLineId,
    ensureDesktopFfmpegReady,
    extractAudioSync,
    getSubtitleLine,
    isAbortError,
    saveWithBrowserPicker,
    showNotification,
    tempSubtitleLine,
    videoFile,
    videoName,
    videoPath,
  ]);

  return {
    isExporting,
    handleCancelExport: () => {
      exportInProgressRef.current = false;
      setIsExporting(false);
    },
    handleSaveSubtitles,
    handleDownloadSubtitles,
    handleExportApkg,
    handleCaptureFrame,
    handleDownloadAudio,
  };
};

