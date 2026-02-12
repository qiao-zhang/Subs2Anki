import React, {useState, useRef, useEffect, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {SubtitleLine, AnkiCard} from './services/types.ts';
import {serializeSubtitles} from './services/parser.ts';
import {formatTimestamp} from './services/time.ts';
import {generateAnkiDeck} from './services/export.ts';
import {ffmpegService} from './services/ffmpeg.ts';
import {storeMedia, deleteMedia} from './services/db.ts';
import {furiganaService} from './services/furigana.ts';
import {syncToAnki, checkConnection} from './services/anki-connect.ts';
import saveAs from 'file-saver';
import {makeMediaFileName, formatTimeForFilename} from '@/services/filename-utils.ts';
import VideoPlayer, {VideoPlayerHandle} from '@/components/VideoPlayer.tsx';
import WaveformDisplay from '@/components/WaveformDisplay.tsx';
import DeckColumn from '@/components/DeckColumn.tsx';
import SubtitleColumn from '@/components/SubtitleColumn.tsx';
import AppControlBar from '@/components/AppControlBar.tsx';
import EditableProjectName from './components/EditableProjectName.tsx';
import ProjectControls from '@/components/ProjectControls.tsx';
import TemplateEditorModal from '@/components/modals/TemplateEditorModal.tsx';
import CardPreviewModal from '@/components/modals/CardPreviewModal.tsx';
import SettingsModal from '@/components/modals/SettingsModal.tsx';
import {useAppStore} from '@/services/store.ts';
import {useMediaProcessing} from '@/hooks/useMediaProcessing.ts';
import ProcessingOverlay from '@/components/ProcessingOverlay.tsx';
import ShortcutsCheatSheetModal from '@/components/modals/ShortcutsCheatSheetModal.tsx';
import {createProjectRecord, saveProjectRecord, loadProjectRecord} from './services/project-record.ts';
import {useAnkiConnect} from '@/hooks/useAnkiConnect.ts';
import {useKeyboardShortcuts} from "@/hooks/useKeyboardShortcuts.tsx";

const App: React.FC = () => {
  // 初始化i18n翻译
  const {t} = useTranslation();

  // --- Global State from Zustand ---
  const {
    videoSrc, videoName, projectName, videoFile, setVideo, resetVideo,
    setProjectName,
    subtitleLines, subtitleFileName, fileHandle,
    setSubtitles, shiftSubtitles,
    addSubtitleLine, removeSubtitle, getSubtitleLine,
    mergeSubtitleLines, breakUpSubtitleLine,
    updateSubtitleText, toggleSubtitleLineStatus, setSubtitleLineStatus,
    undo, redo, canUndo, canRedo,
    ankiCards, addCard, deleteCard,
    updateCardSyncStatus, clearCards,
    ankiConfig, setAnkiConfig,
    ankiConnectUrl, setAnkiConnectUrl,
    bulkCreateLimit, setBulkCreateLimit,
    autoDeleteSynced, setAutoDeleteSynced,
    showBulkCreateButton, setShowBulkCreateButton,
    audioVolume, setAudioVolume,
    setHasUnsavedChanges
  } = useAppStore();

  // Determine if there is project data to show the reset button
  const hasProjectData = videoSrc !== '' ||
    subtitleLines.length > 0 ||
    ankiCards.length > 0 ||
    projectName !== '';

  // --- AnkiConnect Status ---
  const {isConnected, decks, refreshDecks} = useAnkiConnect(ankiConnectUrl);

  // --- Selected Deck State ---
  const [selectedDeck, setSelectedDeck] = useState<string>('');

  // --- Global Tags State ---
  const [globalTags, setGlobalTags] = useState<string[]>([]);

  // Initialize selected deck when project name changes (but only if not already set)
  useEffect(() => {
    // Only set default if selectedDeck is empty (not loaded from a project file)
    if (!selectedDeck) {
      const defaultDeckName = projectName ? `Subs2Anki::${projectName}` : 'Subs2Anki Export';
      setSelectedDeck(defaultDeckName);
    }
  }, [projectName]);

  // --- Local UI State (Transient) ---
  const [pauseAtTime, setPauseAtTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeSubtitleLineId, setActiveSubtitleLineId] = useState<number | null>(null);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>(''); // 当前字幕文本

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState({current: 0, total: 0});
  const [isBulkCreating, setIsBulkCreating] = useState<boolean>(false);
  const [bulkCreateProgress, setBulkCreateProgress] = useState({current: 0, total: 0});
  const [notification, setNotification] = useState<{ visible: boolean; text: string }>({visible: false, text: ''});

  // noinspection JSUnusedLocalSymbols
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [regionsHidden, setRegionsHidden] = useState<boolean>(false);
  const [isVideoOnly, setIsVideoOnlyMode] = useState<boolean>(false);

  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [previewCard, setPreviewCard] = useState<AnkiCard | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  const [tempSubtitleLine, setTempSubtitleLine] = useState<{ start: number, end: number } | null>(null);

  // Refs
  const videoPlayerRef = useRef<VideoPlayerHandle>(null);

  // Reset video ready state when src changes
  useEffect(() => {
    setIsVideoReady(false);
  }, [videoSrc]);

  // --- Background Media Processing ---
  useMediaProcessing(
    videoFile,
    previewCard
  );

  // --- Logic Helpers ---
  const jumpToSubtitleLine = useCallback((direction: 'next' | 'prev') => {
    if (subtitleLines.length === 0) return;

    let nextIndex: number;
    const currentIndex = subtitleLines.findIndex(s => s.id === activeSubtitleLineId);

    if (direction === 'next') {
      if (currentIndex === -1) {
        // Find first subtitle after current time
        nextIndex = subtitleLines.findIndex(s => s.startTime > currentTime);
        if (nextIndex === -1) nextIndex = 0;
      } else {
        nextIndex = Math.min(subtitleLines.length - 1, currentIndex + 1);
      }
    } else {
      if (currentIndex === -1) {
        // Find first subtitle before current time
        const revIndex = [...subtitleLines].reverse().findIndex(s => s.startTime < currentTime);
        nextIndex = revIndex === -1 ? 0 : subtitleLines.length - 1 - revIndex;
      } else {
        nextIndex = Math.max(0, currentIndex - 1);
      }
    }

    const sub = subtitleLines[nextIndex];
    if (sub) {
      playTimeSpan(sub.startTime, sub.endTime);
    }
  }, [subtitleLines, activeSubtitleLineId, currentTime]);

  // Undo/Redo handler
  const handleUndo = () => {
    if (canUndo()) {
      undo();
    }
  };

  const handleRedo = () => {
    if (canRedo()) {
      redo();
    }
  };

  const handleBreakUp = () => {
    if (activeSubtitleLineId !== null) {
      breakUpSubtitleLine(activeSubtitleLineId);
    }
  };

  const handleMergeWithNext = () => {
    if (activeSubtitleLineId === null) return;
    const currentLine = getSubtitleLine(activeSubtitleLineId);
    if (!currentLine) return;
    const nextLine = subtitleLines.find(s => s.startTime > currentLine.startTime);
    mergeSubtitleLines([activeSubtitleLineId, nextLine.id]);
  };

  useKeyboardShortcuts({
    setActiveSubtitleLineId,
    setTempSubtitleLine,
    onToggleRegionsHidden: () => {
      if (regionsHidden) {
        setRegionsHidden(false);
        return;
      }
      setActiveSubtitleLineId(null);
      setTempSubtitleLine(null);
      setRegionsHidden(true);
    },
    onToggleIsVideoOnlyMode: () => {
      if (isVideoOnly) {
        setIsVideoOnlyMode(false);
        return;
      }
      setActiveSubtitleLineId(null);
      setTempSubtitleLine(null);
      setIsVideoOnlyMode(true);
    },
    onPlay: () => {
      setActiveSubtitleLineId(null);
      setTempSubtitleLine(null);
      videoPlayerRef.current?.playPause();
    },
    onReplay(): void {
      if (activeSubtitleLineId !== null) {
        handleSubtitleLineClicked(activeSubtitleLineId);
        return;
      }
      if (tempSubtitleLine !== null) {
        playTimeSpan(tempSubtitleLine.start, tempSubtitleLine.end);
        return;
      }
      videoPlayerRef.current?.playPause();
    },
    onCreateCard: async () => {
      if (activeSubtitleLineId === null) return;
      await handleCreateCard(activeSubtitleLineId);
    },
    onJumpNext: () => jumpToSubtitleLine('next'),
    onJumpPrev: () => jumpToSubtitleLine('prev'),
    onToggleStatusOfActiveSubtitleLine: () => {
      if (activeSubtitleLineId === null) return;
      toggleSubtitleLineStatus(activeSubtitleLineId);
    },
    onOpenOrCloseShortcutsModal: () => setIsShortcutsModalOpen(prev => !prev),
    onOpenOrCloseSettings: () => setIsSettingsModalOpen(prev => !prev),
    onBreakUp: handleBreakUp,
    onMergeWithNext: handleMergeWithNext,
    onRedo: handleRedo,
    onUndo: handleUndo,
  });

  // --- Handlers ---
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideo(file);
    }
  };

  const handleTempSubtitleLineCreated = (start: number, end: number) => {
    setActiveSubtitleLineId(null);
    setTempSubtitleLine({start, end});
  };

  const handleTempSubtitleLineUpdated = (start: number, end: number) => {
    setActiveSubtitleLineId(null);
    setTempSubtitleLine({start, end});
  };

  const handleTempSubtitleLineRemoved = () => {
    setTempSubtitleLine(null);
  }

  const playTimeSpan = (start: number, end: number) => {
    if (videoPlayerRef.current === null) return;
    setPauseAtTime(end);
    videoPlayerRef.current?.seekTo(start);
    videoPlayerRef.current?.play();
  }

  const handleTempSubtitleLineClicked = () => {
    if (!tempSubtitleLine) return;
    playTimeSpan(tempSubtitleLine.start, tempSubtitleLine.end);
  };

  const extractAudioSync = async (start: number, end: number): Promise<Blob | null> => {
    if (!videoFile) return null;
    try {
      videoPlayerRef.current?.pause();
      return await ffmpegService.extractAudioClip(videoFile, start, end);
    } catch (e) {
      console.error("Audio extraction failed", e);
      return null;
    }
  };

  const handleCommitTempSubtitleLine = (text: string) => {
    if (!tempSubtitleLine) return;
    const maxId = subtitleLines.reduce((max, s) => Math.max(max, s.id), 0);
    const newSubLine: SubtitleLine = {
      id: maxId + 1,
      startTime: tempSubtitleLine.start,
      endTime: tempSubtitleLine.end,
      text,
      status: 'normal'
    };
    addSubtitleLine(newSubLine);
    setTempSubtitleLine(null);
  };

  const handleSaveSubtitles = async () => {
    if (!subtitleFileName) return;
    if (fileHandle) {
      try {
        const isVtt = subtitleFileName.toLowerCase().endsWith('.vtt');
        const content = serializeSubtitles(subtitleLines, isVtt ? 'vtt' : 'srt');
        // @ts-ignore
        const writable = await fileHandle.createWritable();
        // @ts-ignore
        await writable.write(content);
        // @ts-ignore
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
      // @ts-ignore
      if (window.showSaveFilePicker) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: subtitleFileName,
          types: [{description: 'Subtitle File', accept: {'text/plain': [isVtt ? '.vtt' : '.srt']}}]
        });
        // @ts-ignore
        const writable = await handle.createWritable();
        // @ts-ignore
        await writable.write(content);
        // @ts-ignore
        await writable.close();
      } else {
        const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
        saveAs(blob, subtitleFileName);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);

    // Manual pause override (from Waveform selection or subtitle click)
    if (pauseAtTime !== null && time >= pauseAtTime) {
      videoPlayerRef.current?.pause();
      videoPlayerRef.current?.seekTo(pauseAtTime);
      setPauseAtTime(null);
      return;
    }

    // Efficiently find active subtitle index
    const activeIndex = subtitleLines.findIndex(s => time >= s.startTime && time <= s.endTime);
    const active = activeIndex !== -1 ? subtitleLines[activeIndex] : null;

    if (active && active.id !== activeSubtitleLineId) {
      setActiveSubtitleLineId(active.id);
      setCurrentSubtitleText(active.text); // 更新当前字幕文本
    } else if (!active) {
      setActiveSubtitleLineId(null);
      setCurrentSubtitleText(''); // 清空当前字幕文本
    } else if (active && active.id === activeSubtitleLineId) {
      // 如果当前活跃字幕没有变化，但仍需确保字幕文本正确
      setCurrentSubtitleText(active.text);
    }
  };

  const handleSeek = (time: number) => {
    setPauseAtTime(null);
    videoPlayerRef.current?.seekTo(time);
  };

  // 显示复制通知
  const showNotification = (text: string) => {
    setNotification({visible: true, text});
    setTimeout(() => {
      setNotification({visible: false, text: ''});
    }, 3000);
  };

  const handleSubtitleLineClicked = (id: number, copyText: boolean = true) => {
    const sub = getSubtitleLine(id);

    if (sub && copyText) {
      // 复制字幕文本到剪贴板
      navigator.clipboard.writeText(sub.text).then(() => {
        // 显示复制成功的提示
        showNotification(t("notification.copiedToClipboard", {
          defaultValue: '"{{text}}" copied to clipboard',
          text: sub.text
        }));
      }).catch(err => {
        console.error('Cannot copy text:', err);
      });
    }

    if (sub && videoPlayerRef.current) {
      setTempSubtitleLine(null);
      setActiveSubtitleLineId(id);
      playTimeSpan(sub.startTime, sub.endTime);
    }
  };

  const handleCreateCard = async (id: number) => {
    const s = getSubtitleLine(id);
    if (s) await createCardForSubtitleLine(s);
  }

  const createCardForSubtitleLine = async (sub: SubtitleLine) => {
    if (!videoPlayerRef.current) return;
    if (sub.status !== 'normal') return;

    // setPauseAtTime(null);
    const furigana = furiganaService.convert(sub.text);

    // Capture Screenshot immediately
    const screenshot = await videoPlayerRef.current.captureFrameAt(sub.startTime);

    let screenshotRef = null;
    if (screenshot) {
      screenshotRef = crypto.randomUUID();
      await storeMedia(screenshotRef, screenshot);
    }

    const timestampStr = formatTimestamp(sub.startTime, 'dot', 1);
    const cardId = `${projectName.replace(/[\p{P}\s]/gu, '_')}_${timestampStr.replace(/:/g, '.')}_${sub.text.replace(/[\p{P}\s]/gu, '_')}`;
    // const cardId = `${projectName.replace(/[\p{P}\s]/gu, '_')}_${timestampStr}`;

    // Add card with pending audio status
    const newCard: AnkiCard = {
      id: cardId,
      subtitleId: sub.id,
      text: sub.text,
      translation: '',
      notes: '',
      furigana: await furigana,
      tags: [...globalTags], // Add global tags to the new card
      screenshotRef: screenshotRef,
      audioRef: null,
      audioStatus: 'pending',
      timestampStr: timestampStr,
      syncStatus: 'unsynced', // New cards are not synced by default
    };

    addCard(newCard);

    // Automatically lock the subtitle line after creating a card from it
    setSubtitleLineStatus(sub.id, 'locked');
  };

  const handleBulkCreateCards = async () => {
    const normalSubtitles = subtitleLines.filter(sub => sub.status === 'normal');

    if (normalSubtitles.length === 0) {
      showNotification(
        t("notification.noLines", {defaultValue: 'No subtitle lines to make cards'}));
      return;
    }

    // Limit the number of cards created in bulk to prevent memory issues
    const limitedSubtitles = normalSubtitles.slice(0, bulkCreateLimit);

    setIsBulkCreating(true);
    setBulkCreateProgress({current: 0, total: limitedSubtitles.length});

    for (let i = 0; i < limitedSubtitles.length; i++) {
      await createCardForSubtitleLine(limitedSubtitles[i]);
      setBulkCreateProgress({current: i + 1, total: limitedSubtitles.length});
    }

    setIsBulkCreating(false);

    showNotification(t("notification.cardCreated", {
      num: limitedSubtitles.length
    }));
  };

  const deleteScreenshotAndAudioForCard = async (id: string) => {
    const card = ankiCards.find(c => c.id === id);
    if (card) {
      try {
        if (card.screenshotRef) await deleteMedia(card.screenshotRef);
        if (card.audioRef) await deleteMedia(card.audioRef);
      } catch (e) {
        console.error("Failed to delete media from DB", e);
      }
    }
  }

  const handleDeleteCard = async (id: string) => {
    await deleteScreenshotAndAudioForCard(id);
    deleteCard(id);
  };

  const handleSyncCard = async (id: string, targetDeckName?: string) => {
    const card = ankiCards.find(c => c.id === id);
    if (!card) return;

    // Check if card is already synced
    if (card.syncStatus !== 'unsynced') {
      alert('This card already has been synced or is syncing to Anki.');
      return;
    }

    // Check if media is ready
    if (card.audioStatus !== 'done') {
      alert('Media files are not ready yet. Please wait for audio processing to complete.');
      return;
    }

    try {
      // Check connection to Anki
      const connected = await checkConnection(ankiConnectUrl);
      if (!connected) {
        alert('Could not connect to Anki. Please check your AnkiConnect settings and ensure Anki is running.');
        setIsSettingsModalOpen(true);
        return;
      }

      const deckName = targetDeckName || (projectName ? `Subs2Anki::${projectName}` : 'Subs2Anki Export');

      // Sync only this card
      updateCardSyncStatus(id, 'syncing');
      await syncToAnki(ankiConnectUrl, deckName, ankiConfig, [card], (cur, tot) => {
        setSyncProgress({current: cur, total: tot});
      });

      // Update card's sync status
      updateCardSyncStatus(id, 'synced');

      if (autoDeleteSynced) {
        await handleDeleteCard(id);
      }
      showNotification(t("notifications.syncSuccess", {num: "1", deckName}));
    } catch (e) {
      console.error(e);
      alert(`Sync failed: ${(e as Error).message}`);
    }
  };

  const handleSyncCards = async () => {
    setIsSyncing(true);
    try {
      const connected = await checkConnection(ankiConnectUrl);
      if (!connected) {
        setIsSyncing(false);
        alert('Could not connect to Anki. Please check your AnkiConnect settings and ensure Anki is running.');
        setIsSettingsModalOpen(true);
        return;
      }

      // Filter out cards that are already synced
      const unsyncedCards = ankiCards.filter(card => card.syncStatus === 'unsynced');

      if (unsyncedCards.length === 0) {
        alert('All cards have already been synced to Anki!');
        return;
      }

      // Update sync status for all
      unsyncedCards.forEach(card => {
        updateCardSyncStatus(card.id, 'syncing');
      });

      await syncToAnki(ankiConnectUrl, selectedDeck, ankiConfig, unsyncedCards, (cur, tot) => {
        setSyncProgress({current: cur, total: tot});
      }, async (cardId: string) => {
        if (autoDeleteSynced) {
          await handleDeleteCard(cardId);
        } else {
          updateCardSyncStatus(cardId, 'synced');
        }
      });

      showNotification(t("notifications.syncSuccess", {num: unsyncedCards.length, deckName: selectedDeck}));
    } catch (e) {
      console.error(e);
      alert(`Sync failed: ${(e as Error).message}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress({current: 0, total: 0});
    }
  }

  const handleExportApkg = async () => {
    setIsExporting(true);
    await generateAnkiDeck(ankiCards, projectName, ankiConfig);
    setIsExporting(false);
  }

  const handleCaptureFrame = async () => {
    if (!videoPlayerRef.current) return;
    const dataUrl = await videoPlayerRef.current.captureFrame();
    if (!dataUrl) return;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const currentTime = videoPlayerRef.current?.getCurrentTime() || 0;

    // 查找当前时间对应的字幕行
    const currentSubtitle = subtitleLines.find(sub =>
      currentTime >= sub.startTime && currentTime <= sub.endTime
    );

    // 使用共享的工具函数生成文件名
    const timeStr = formatTimeForFilename(currentTime);
    const fileName = makeMediaFileName(videoName, '.jpg', timeStr, currentSubtitle ? currentSubtitle.text : '');

    try {
      // @ts-ignore
      if (window.showSaveFilePicker) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'Snapshot',
            // accept: "*.wav"
          }]
        });
        // @ts-ignore
        const writable = await handle.createWritable();
        // @ts-ignore
        await writable.write(blob);
        // @ts-ignore
        await writable.close();
      } else {
        saveAs(blob, fileName);
      }
    } catch (err) {
    }
  };

  const handleSaveProject = async () => {
    try {
      const appState = {
        projectName,
        videoName,
        subtitleFileName,
        subtitleLines,
        ankiConfig,
        ankiConnectUrl
      };

      const record = createProjectRecord(appState, selectedDeck, globalTags,
        bulkCreateLimit, autoDeleteSynced, showBulkCreateButton, audioVolume);
      await saveProjectRecord(record);
      showNotification(t("notifications.projectSaved", {defaultValue: "Project saved successfully!"}));
    } catch (error) {
      console.error("Failed to save project:", error);
      alert("Failed to save project: " + (error as Error).message);
    }
  };

  const handleLoadProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const record = await loadProjectRecord(file);

      // 更新应用状态（视频文件需要用户重新上传，但我们保留文件名）
      setProjectName(record.projectName);
      setSubtitles(record.subtitleLines, record.subtitleFileName);
      setAnkiConfig(record.ankiConfig);
      setAnkiConnectUrl(record.ankiConnectUrl);

      // 如果记录中包含选定的deck名称，则恢复它
      if (record.selectedDeck) {
        setSelectedDeck(record.selectedDeck);
      } else {
        // 否则使用默认的deck名称
        const defaultDeckName = record.projectName ? `Subs2Anki::${record.projectName}` : 'Subs2Anki Export';
        setSelectedDeck(defaultDeckName);
      }

      // 如果记录中包含全局标签，则恢复它们
      if (record.globalTags) {
        setGlobalTags(record.globalTags);
      } else {
        setGlobalTags([]); // 默认为空数组
      }

      // 如果记录中包含批量创建限制，则恢复它
      if (record.bulkCreateLimit !== undefined) {
        setBulkCreateLimit(record.bulkCreateLimit);
      }

      // 如果记录中包含自动删除同步后卡片的设置，则恢复它
      if (record.autoDeleteSynced !== undefined) {
        setAutoDeleteSynced(record.autoDeleteSynced);
      }

      // 如果记录中包含显示批量创建按钮的设置，则恢复它
      if (record.showBulkCreateButton !== undefined) {
        setShowBulkCreateButton(record.showBulkCreateButton);
      }

      showNotification(t("notifications.projectLoaded", {
        defaultValue: "Project loaded successfully!"
      }));
    } catch (error) {
      console.error("Failed to load project:", error);
      alert("Failed to load project: " + (error as Error).message);
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

    showNotification(t("notifications.cardRemoved", {num: syncedCards.length}));
  };

  const handleDownloadAudio = async () => {
    if (!videoFile) return;
    if (tempSubtitleLine === null && activeSubtitleLineId === null) return;
    let start: number, end: number;
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
      // @ts-ignore
      if (window.showSaveFilePicker) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Audio File',
            // accept: "*.wav"
          }]
        });
        // @ts-ignore
        const writable = await handle.createWritable();
        // @ts-ignore
        await writable.write(blob);
        // @ts-ignore
        await writable.close();
      } else {
        saveAs(blob, filename);
      }
    } catch (err) {
    }
  };

  const handleResetProject = () => {
    // Revoke the current video object URL if it exists to free memory
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }

    // Reset all app state to initial values using the store setters
    setProjectName('');

    // Reset video state to initial values
    resetVideo();

    // Also reset subtitles
    setSubtitles([], '');
    setHasUnsavedChanges(false);

    // Reset UI state
    setPauseAtTime(null);
    setCurrentTime(0);
    setActiveSubtitleLineId(null);
    setCurrentSubtitleText('');
    setTempSubtitleLine(null);

    // Reset processing states
    setIsExporting(false);
    setIsSyncing(false);
    setSyncProgress({current: 0, total: 0});
    setIsBulkCreating(false);
    setBulkCreateProgress({current: 0, total: 0});

    // Reset video player state
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(0);
    }

    // Reset regions and video-only modes
    setRegionsHidden(false);
    setIsVideoOnlyMode(false);

    // Clear all cards
    ankiCards.forEach(async card => await deleteScreenshotAndAudioForCard(card.id));
    clearCards();

    // Reset deck and tags to initial state
    setSelectedDeck('Subs2Anki Export'); // Default deck name when project is reset
    setGlobalTags([]);

    // Reset any temporary modal states
    setIsTemplateModalOpen(false);
    setIsSettingsModalOpen(false);
    setPreviewCard(null);
    setIsShortcutsModalOpen(false);

    showNotification(t("notifications.projectReset", {
      defaultValue: "Project has been reset"
    }));
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden relative">

      {isSyncing && <ProcessingOverlay
        isInProcess={isSyncing}
        InProcessMessage={t("modals.syncingToAnki", {defaultValue: "Syncing to Anki..."})}
        Progress={syncProgress}
      >
        {t("modals.cardsSynced", {
          defaultValue: "{{current}} / {{total}} cards synced",
          current: syncProgress.current,
          total: syncProgress.total
        })}
      </ProcessingOverlay>}
      {isBulkCreating && <ProcessingOverlay
        isInProcess={isBulkCreating}
        InProcessMessage={t("modals.creatingCards", {defaultValue: "Creating Cards..."})}
        Progress={bulkCreateProgress}
      >
        {t("modals.cardsCreated", {
          defaultValue: "{{current}} / {{total}} cards created",
          current: bulkCreateProgress.current,
          total: bulkCreateProgress.total
        })}
      </ProcessingOverlay>}
      {isExporting && <ProcessingOverlay
        isInProcess={isExporting}
        InProcessMessage={t("modals.preparingExport", {defaultValue: "Preparing Export..."})}
        onCancel={() => setIsExporting(false)}
      >
        {t("modals.processingMedia", {
          defaultValue: "Processing media ({{count}} remaining)",
          count: ankiCards.filter(c => c.audioStatus !== 'done').length
        })}
      </ProcessingOverlay>}

      {/* Top Part: 3 Columns */}
      <div className="flex flex-1 min-h-0 w-full">
        <DeckColumn
          cards={ankiCards}
          onDelete={handleDeleteCard}
          onPreview={(c) => setPreviewCard(c)}
          onSyncCard={(id) => handleSyncCard(id, selectedDeck)}
          onSyncCards={handleSyncCards}
          onOpenTemplateSettings={() => setIsTemplateModalOpen(true)}
          onExport={handleExportApkg}
          onOpenAnkiSettings={() => setIsSettingsModalOpen(true)}
          onDeleteSynced={handleDeleteSyncedCards}
          isConnected={isConnected}
          decks={decks}
          ankiConnectUrl={ankiConnectUrl}
          projectName={projectName}
          selectedDeck={selectedDeck}
          onDeckChange={setSelectedDeck}
          globalTags={globalTags}
          onGlobalTagsChange={setGlobalTags}
          className={`${isVideoOnly ? 'hidden' : ''}`}
        />

        {/* COL 2: VIDEO (Center) */}
        <main className="flex-1 flex flex-col bg-slate-950 relative min-w-0">
          {/* Project Controls Above Video Player */}
          {!isVideoOnly &&
            <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
              <EditableProjectName
                projectName={projectName}
                onProjectNameChange={setProjectName}
                className="text-lg font-semibold"
              />
              <ProjectControls
                onSaveProject={handleSaveProject}
                onLoadProject={handleLoadProject}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onResetProject={handleResetProject}
                hasProjectData={hasProjectData}
              />
            </div>
          }

          {/* Video Player Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 bg-black/20 min-h-0">
            <div className="w-full h-full max-w-5xl flex flex-col justify-center">
              <VideoPlayer
                ref={videoPlayerRef}
                src={videoSrc}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => setIsVideoReady(true)}
                currentSubtitle={currentSubtitleText}
              />
            </div>
          </div>
        </main>

        {/* COL 3: SUBTITLE LINES (Right) */}
        <SubtitleColumn
          className={`${isVideoOnly ? 'hidden' : ''}`}
          subtitleLines={subtitleLines}
          activeSubtitleLineId={activeSubtitleLineId}
          subtitleFileName={subtitleFileName}
          canSave={fileHandle !== null}
          onSetSubtitles={setSubtitles}
          onSubtitleLineClicked={handleSubtitleLineClicked}
          onToggleLock={toggleSubtitleLineStatus}
          onCreateCard={handleCreateCard}
          onBulkCreateCards={handleBulkCreateCards}
          onSave={handleSaveSubtitles}
          onDownload={handleDownloadSubtitles}
          onShiftSubtitles={shiftSubtitles}
          showBulkCreateButton={showBulkCreateButton}
          bulkCreateLimit={bulkCreateLimit}
        />
      </div>

      {/* Control Bar - Full Width with Auto Height for Editor */}
      {!isVideoOnly && (
        <div
          className="min-h-20 h-auto py-2 border-t border-slate-800 bg-slate-900 flex items-center justify-center shrink-0 shadow-xl z-30 px-4 gap-4 transition-all w-full">
          <AppControlBar
            tempSubtitleLine={tempSubtitleLine}
            activeSubtitleLineId={activeSubtitleLineId}
            videoName={videoName}
            currentTime={currentTime}
            onTempCommit={handleCommitTempSubtitleLine}
            onVideoUpload={handleVideoUpload}
            onCaptureFrame={handleCaptureFrame}
            onDownloadAudio={handleDownloadAudio}
            onUpdateSubtitleText={updateSubtitleText}
          />
        </div>
      )}

      {/* Bottom Part: Full-width Waveform */}
      <div
        className={`h-48 flex-shrink-0 border-t border-slate-800 bg-slate-900 z-10 w-full relative ${isVideoOnly ? 'hidden' : ''}`}>
        <WaveformDisplay
          videoElement={videoPlayerRef.current?.getVideoElement() || null}
          videoSrc={videoSrc}
          currentTime={currentTime}
          onSeek={handleSeek}
          regionsHidden={regionsHidden}
          onTempSubtitleLineCreated={handleTempSubtitleLineCreated}
          onTempSubtitleLineUpdated={handleTempSubtitleLineUpdated}
          onTempSubtitleLineClicked={handleTempSubtitleLineClicked}
          onTempSubtitleLineRemoved={handleTempSubtitleLineRemoved}
          onSubtitleLineClicked={(id) => handleSubtitleLineClicked(id, false)}
          onSubtitleLineRemoved={removeSubtitle}
          onCreateCard={handleCreateCard}
        />
      </div>

      {/* Modals */}
      <TemplateEditorModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)}
                           config={ankiConfig} onSave={setAnkiConfig}/>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        ankiConnectUrl={ankiConnectUrl}
        onSaveAnkiConnectUrl={setAnkiConnectUrl}
        autoDeleteSynced={autoDeleteSynced}
        onAutoDeleteSyncedChange={setAutoDeleteSynced}
        bulkCreateLimit={bulkCreateLimit}
        onBulkCreateLimitChange={setBulkCreateLimit}
        showBulkCreateButton={showBulkCreateButton}
        onShowBulkCreateButtonChange={setShowBulkCreateButton}
        audioVolume={audioVolume}
        onAudioVolumeChange={setAudioVolume}
        onTestSuccess={refreshDecks}
      />
      <CardPreviewModal
        isOpen={!!previewCard}
        card={previewCard ? ankiCards.find(c => c.id === previewCard.id) || previewCard : null}
        onClose={() => setPreviewCard(null)}
      />
      <ShortcutsCheatSheetModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {notification.visible && (
        <div
          className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-50 bg-slate-700/80 text-slate-200 px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 border border-slate-600">
          {notification.text.substring(0, 30)}{notification.text.length > 30 ? '...' : ''}
        </div>
      )}
    </div>
  );
};

export default App;
