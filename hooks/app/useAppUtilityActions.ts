import React, {RefObject} from 'react';
import saveAs from 'file-saver';
import {serializeSubtitles} from '@/services/parser.ts';
import {ffmpegService} from '@/services/ffmpeg.ts';
import {makeMediaFileName, formatTimeForFilename} from '@/services/filename-utils.ts';
import {SubtitleLine} from '@/services/types.ts';
import {VideoPlayerHandle} from '@/components/VideoPlayer.tsx';

interface UseAppUtilityActionsParams {
  setVideo: (file: File) => void;
  videoFile: File | null;
  videoPlayerRef: RefObject<VideoPlayerHandle | null>;
  subtitleFileName: string;
  fileHandle: FileSystemFileHandle | null;
  subtitleLines: SubtitleLine[];
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  getSubtitleLine: (id: number) => SubtitleLine | null;
  showNotification: (text: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  ankiCards: Array<{ id: string; syncStatus?: 'unsynced' | 'syncing' | 'synced' }>;
  handleDeleteCard: (id: string) => Promise<void>;
  tempSubtitleLine: { start: number; end: number } | null;
  activeSubtitleLineId: number | null;
  videoName: string;
}

export const useAppUtilityActions = ({
  setVideo,
  videoFile,
  videoPlayerRef,
  subtitleFileName,
  fileHandle,
  subtitleLines,
  setHasUnsavedChanges,
  getSubtitleLine,
  showNotification,
  t,
  ankiCards,
  handleDeleteCard,
  tempSubtitleLine,
  activeSubtitleLineId,
  videoName,
}: UseAppUtilityActionsParams) => {
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideo(file);
    }
  };

  const extractAudioSync = async (start: number, end: number): Promise<Blob | null> => {
    if (!videoFile) return null;
    try {
      videoPlayerRef.current?.pause();
      return await ffmpegService.extractAudioClip(videoFile, start, end);
    } catch (e) {
      console.error('Audio extraction failed', e);
      return null;
    }
  };

  const handleSaveSubtitles = async () => {
    if (!subtitleFileName) return;
    if (fileHandle) {
      try {
        const isVtt = subtitleFileName.toLowerCase().endsWith('.vtt');
        const content = serializeSubtitles(subtitleLines, isVtt ? 'vtt' : 'srt');
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        setHasUnsavedChanges(false);
      } catch (err) {
        alert('Failed to save file.');
      }
    } else {
      setHasUnsavedChanges(false);
    }
  };

  const handleDownloadSubtitles = async () => {
    if (!subtitleFileName) return;
    const isVtt = subtitleFileName.toLowerCase().endsWith('.vtt');
    const content = serializeSubtitles(subtitleLines, isVtt ? 'vtt' : 'srt');
    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: subtitleFileName,
          types: [{description: 'Subtitle File', accept: {'text/plain': [isVtt ? '.vtt' : '.srt']}}],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
      } else {
        const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
        saveAs(blob, subtitleFileName);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
    }
  };

  const handleSubtitleLineShiftClicked = (id: number) => {
    const sub = getSubtitleLine(id);
    if (!sub) return;

    navigator.clipboard.writeText(sub.text).then(() => {
      showNotification(t('notifications.copiedToClipboard', {
        defaultValue: '"{{text}}" copied to clipboard',
        text: sub.text,
      }));
    }).catch(err => {
      console.error('Cannot copy text:', err);
    });
  };

  const handleCaptureFrame = async () => {
    if (!videoPlayerRef.current) return;
    const dataUrl = await videoPlayerRef.current.captureFrame();
    if (!dataUrl) return;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const currentTime = videoPlayerRef.current?.getCurrentTime() || 0;

    const currentSubtitle = subtitleLines.find(sub => currentTime >= sub.startTime && currentTime <= sub.endTime);
    const timeStr = formatTimeForFilename(currentTime);
    const fileName = makeMediaFileName(videoName, '.jpg', timeStr, currentSubtitle ? currentSubtitle.text : '');

    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{description: 'Snapshot'}],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        saveAs(blob, fileName);
      }
    } catch (err) {
    }
  };

  const handleDeleteSyncedCards = async () => {
    const syncedCards = ankiCards.filter(card => card.syncStatus === 'synced');

    if (syncedCards.length === 0) {
      alert('No synced cards to delete.');
      return;
    }

    const confirmDeletion = confirm(`Are you sure you want to delete ${syncedCards.length} synced card(s)?`);
    if (!confirmDeletion) return;

    for (const card of syncedCards) {
      await handleDeleteCard(card.id);
    }

    showNotification(t('notifications.cardRemoved', {num: syncedCards.length}));
  };

  const handleDownloadAudio = async () => {
    if (!videoFile) return;
    if (tempSubtitleLine === null && activeSubtitleLineId === null) return;
    let start: number;
    let end: number;
    let currentSub: SubtitleLine | undefined;

    if (tempSubtitleLine !== null) {
      start = tempSubtitleLine.start;
      end = tempSubtitleLine.end;
    } else {
      currentSub = subtitleLines.find(s => s.id === activeSubtitleLineId);
      if (currentSub == null) return;
      start = currentSub.startTime;
      end = currentSub.endTime;
    }

    const blob = await extractAudioSync(start, end);
    const startStr = formatTimeForFilename(start);
    const endStr = formatTimeForFilename(end);
    const filename = makeMediaFileName(videoName, '.wav', `${startStr}_${endStr}`, currentSub ? currentSub.text : '');

    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{description: 'Audio File'}],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        saveAs(blob, filename);
      }
    } catch (err) {
    }
  };

  return {
    handleVideoUpload,
    handleSaveSubtitles,
    handleDownloadSubtitles,
    handleSubtitleLineShiftClicked,
    handleCaptureFrame,
    handleDeleteSyncedCards,
    handleDownloadAudio,
  };
};

