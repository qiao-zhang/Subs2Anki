import React, {useState, useRef, useEffect, useCallback} from 'react';
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
import AnkiConnectSettingsModal from '@/components/modals/AnkiConnectSettingsModal.tsx';
import {useAppStore} from '@/services/store.ts';
import {useMediaProcessing} from '@/hooks/useMediaProcessing.ts';
import ProcessingOverlay from '@/components/ProcessingOverlay.tsx';
import KeyboardShortcutsHandler from '@/components/KeyboardShortcutsHandler.tsx';
import ShortcutsCheatSheetModal from '@/components/modals/ShortcutsCheatSheetModal.tsx';
import {createProjectRecord, saveProjectRecord, loadProjectRecord} from './services/project-record.ts';
import {useAnkiConnect} from '@/hooks/useAnkiConnect.ts';

const App: React.FC = () => {
  // --- Global State from Zustand ---
  const {
    videoSrc, videoName, projectName, videoFile, setVideo, setProjectName,
    subtitleLines, subtitleFileName, fileHandle, setSubtitles,
    updateSubtitleText, toggleSubtitleLineStatus, setSubtitleLineStatus,
    addSubtitle, removeSubtitle,
    shiftSubtitles,
    undo, redo, canUndo, canRedo,
    ankiCards, addCard, updateCard, deleteCard,
    ankiConfig, setAnkiConfig,
    ankiConnectUrl, setAnkiConnectUrl,
  } = useAppStore();

  // --- AnkiConnect Status ---
  const { isConnected, decks, isLoading, refreshDecks } = useAnkiConnect(ankiConnectUrl);

  // --- Selected Deck State ---
  const [selectedDeck, setSelectedDeck] = useState<string>(projectName ? `Subs2Anki::${projectName}` : 'Subs2Anki Export');

  // Update selected deck when project name changes
  useEffect(() => {
    const defaultDeckName = projectName ? `Subs2Anki::${projectName}` : 'Subs2Anki Export';
    setSelectedDeck(defaultDeckName);
  }, [projectName]);

  // --- Local UI State (Transient) ---
  const [pauseAtTime, setPauseAtTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeSubtitleLineId, setActiveSubtitleLineId] = useState<number | null>(null);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>(''); // 当前字幕文本

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState({current: 0, total: 0});
  const [notification, setNotification] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });

  // noinspection JSUnusedLocalSymbols
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [regionsHidden, setRegionsHidden] = useState<boolean>(false);
  const [isVideoOnly, setIsVideoOnlyMode] = useState<boolean>(false);

  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isAnkiSettingsOpen, setIsAnkiSettingsOpen] = useState<boolean>(false);
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
  const finalizeExport = async () => {
    setIsExporting(false);
    await generateAnkiDeck(ankiCards, projectName, ankiConfig);
  };

  const finalizeSync = async (targetDeckName: string) => {
    setIsSyncing(true);
    try {
      const connected = await checkConnection(ankiConnectUrl);
      if (!connected) {
        setIsSyncing(false);
        alert('Could not connect to Anki. Please check your AnkiConnect settings and ensure Anki is running.');
        setIsAnkiSettingsOpen(true);
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
        updateCard(card.id, { syncStatus: 'syncing' });
      });

      await syncToAnki(ankiConnectUrl, targetDeckName, projectName, ankiConfig, unsyncedCards, (cur, tot) => {
        setSyncProgress({current: cur, total: tot});
      });

      // Update sync status for all successfully synced cards
      unsyncedCards.forEach(card => {
        updateCard(card.id, { syncStatus: 'synced' });
      });

      alert(`Successfully synced ${unsyncedCards.length} cards to Anki deck: ${targetDeckName}!`);
    } catch (e) {
      console.error(e);
      alert(`Sync failed: ${(e as Error).message}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress({current: 0, total: 0});
    }
  }

  // Reuse media processing hook but trigger different finalizers based on state
  // We need a ref to know which action triggered the wait
  const pendingActionRef = useRef<'export' | 'sync' | null>(null);

  const onMediaReady = () => {
    if (pendingActionRef.current === 'export') {
      finalizeExport().then();
    } else if (pendingActionRef.current === 'sync') {
      finalizeSync(selectedDeck).then();
    }
    pendingActionRef.current = null;
  };

  useMediaProcessing(
    videoFile,
    previewCard,
    isExporting || isSyncing, // isProcessing if either active
    onMediaReady
  );

  // --- Logic Helpers ---
  const jumpToSubtitle = useCallback((direction: 'next' | 'prev') => {
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
    const lines = useAppStore.getState().subtitleLines;
    const maxId = lines.reduce((max, s) => Math.max(max, s.id), 0);
    const newSub: SubtitleLine = {
      id: maxId + 1,
      startTime: tempSubtitleLine.start,
      endTime: tempSubtitleLine.end,
      text,
      status: 'normal'
    };
    addSubtitle(newSub);
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
        useAppStore.getState().setHasUnsavedChanges(false);
      } catch (err) {
        alert('Failed to save file.');
      }
    } else {
      useAppStore.getState().setHasUnsavedChanges(false);
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
        useAppStore.getState().setHasUnsavedChanges(false);
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

  const handlePlay = () => {
    if (activeSubtitleLineId !== null) {
      handleSubtitleLineClicked(activeSubtitleLineId);
      return;
    }
    if (tempSubtitleLine !== null) {
      playTimeSpan(tempSubtitleLine.start, tempSubtitleLine.end);
      return;
    }
    videoPlayerRef.current?.playPause();
  }

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

  // 显示复制通知
  const showNotification = (text: string) => {
    setNotification({ visible: true, text });
    setTimeout(() => {
      setNotification({ visible: false, text: '' });
    }, 2000); // 2秒后自动隐藏
  };

  const handleSubtitleLineClicked = (id: number, copyText: boolean = true) => {
    const sub = useAppStore.getState().subtitleLines.find(s => s.id === id);

    if (sub && copyText) {
      // 复制字幕文本到剪贴板
      navigator.clipboard.writeText(sub.text).then(() => {
        // 显示复制成功的提示
        showNotification(sub.text);
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

  const handleCreateCard = async (sub: SubtitleLine) => {
    if (!videoPlayerRef.current) return;
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
      screenshotRef: screenshotRef,
      audioRef: null,
      audioStatus: 'pending',
      timestampStr: timestampStr,
      syncStatus: 'unsynced', // New cards are not synced by default
    };

    addCard(newCard);

    // Automatically lock the subtitle line after creating a card from it
    setSubtitleLineStatus(sub.id, 'locked');

    /*
    furigana.then(f => {
      updateCard(cardId, {furigana: f});
    });
     */
  };

  const handleDeleteCard = async (id: string) => {
    const card = ankiCards.find(c => c.id === id);
    if (card) {
      try {
        if (card.screenshotRef) await deleteMedia(card.screenshotRef);
        if (card.audioRef) await deleteMedia(card.audioRef);
      } catch (e) {
        console.error("Failed to delete media from DB", e);
      }
      deleteCard(id);
    }
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
        setIsAnkiSettingsOpen(true);
        return;
      }

      const deckName = targetDeckName || (projectName ? `Subs2Anki::${projectName}` : 'Subs2Anki Export');

      // Sync only this card
      updateCard(id, { syncStatus: 'syncing' });
      await syncToAnki(ankiConnectUrl, deckName, projectName, ankiConfig, [card], (cur, tot) => {
        setSyncProgress({current: cur, total: tot});
      });

      // Update card's sync status
      updateCard(id, { syncStatus: 'synced' });

      // alert(`Successfully synced card to Anki!`);
    } catch (e) {
      console.error(e);
      alert(`Sync failed: ${(e as Error).message}`);
    }
  };

  const handleActionClick = (action: 'export' | 'sync', targetDeckName?: string) => {
    pendingActionRef.current = action;

    const pendingAudio = ankiCards.some(c => c.audioStatus === 'pending' || c.audioStatus === 'processing');

    if (pendingAudio) {
      if (action === 'export') setIsExporting(true);
      if (action === 'sync' && targetDeckName) {
        setIsSyncing(true);
        finalizeSync(targetDeckName).then();
      } else {
        setIsExporting(true); // Using generic loading overlay
      }
    } else {
      if (action === 'sync' && targetDeckName) {
        finalizeSync(targetDeckName).then();
      } else {
        onMediaReady();
      }
    }
  };

  const handleCaptureFrame = async () => {
    if (!videoPlayerRef.current) return;
    const dataUrl = await videoPlayerRef.current.captureFrame();
    if (dataUrl) {
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const currentTime = videoPlayerRef.current?.getCurrentTime() || 0;

          // 查找当前时间对应的字幕行
          const currentSubtitle = subtitleLines.find(sub =>
            currentTime >= sub.startTime && currentTime <= sub.endTime
          );

          // 使用共享的工具函数生成文件名
          const timeStr = formatTimeForFilename(currentTime);
          const fileName = makeMediaFileName(videoName, '.jpg', timeStr, currentSubtitle ? currentSubtitle.text : '');

          // TODO add save picker version
          saveAs(blob, fileName);
        });
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

      const record = createProjectRecord(appState);
      await saveProjectRecord(record);
      showNotification("Project saved successfully!");
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

      showNotification("Project loaded successfully!");
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

    showNotification(`Deleted ${syncedCards.length} synced card(s)`);
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

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden relative">
      <ProcessingOverlay
        isExporting={isExporting}
        isSyncing={isSyncing}
        syncProgress={syncProgress}
        setIsExporting={setIsExporting}
      />

      {/* Top Part: 3 Columns */}
      <div className="flex flex-1 min-h-0 w-full">
        {!isVideoOnly && (
          <DeckColumn
            cards={ankiCards}
            onDelete={handleDeleteCard}
            onPreview={(c) => setPreviewCard(c)}
            onSyncCard={(id) => handleSyncCard(id, selectedDeck)}
            onOpenTemplateSettings={() => setIsTemplateModalOpen(true)}
            onExport={() => handleActionClick('export')}
            onSyncAnki={() => handleActionClick('sync', selectedDeck)}
            onOpenAnkiSettings={() => setIsAnkiSettingsOpen(true)}
            onDeleteSynced={handleDeleteSyncedCards}
            isConnected={isConnected}
            decks={decks}
            ankiConnectUrl={ankiConnectUrl}
            projectName={projectName}
            selectedDeck={selectedDeck}
            onDeckChange={setSelectedDeck}
          />
        )}

        {/* COL 2: VIDEO (Center) */}
        <main className="flex-1 flex flex-col bg-slate-950 relative min-w-0">
          {/* Project Controls Above Video Player */}
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <EditableProjectName
              projectName={projectName}
              onProjectNameChange={setProjectName}
              className="text-lg font-semibold"
            />
            <ProjectControls
              onSaveProject={handleSaveProject}
              onLoadProject={handleLoadProject}
            />
          </div>

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
        {!isVideoOnly && (
          <SubtitleColumn
            subtitleLines={subtitleLines}
            activeSubtitleLineId={activeSubtitleLineId}
            subtitleFileName={subtitleFileName}
            canSave={fileHandle !== null}
            onSetSubtitles={setSubtitles}
            onSubtitleLineClicked={handleSubtitleLineClicked}
            onToggleLock={toggleSubtitleLineStatus}
            onCreateCard={(sub) => {
              const s = useAppStore.getState().subtitleLines.find(x => x.id === sub.id);
              if (s) handleCreateCard(s).then();
            }}
            onSave={handleSaveSubtitles}
            onDownload={handleDownloadSubtitles}
            onShiftSubtitles={shiftSubtitles}
          />
        )}
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
            onPlay={handlePlay}
            onCaptureFrame={handleCaptureFrame}
            onDownloadAudio={handleDownloadAudio}
            onUpdateSubtitleText={updateSubtitleText}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo()}
            canRedo={canRedo()}
          />
        </div>
      )}

      {/* Bottom Part: Full-width Waveform */}
      {!isVideoOnly && (
        <div className="h-48 flex-shrink-0 border-t border-slate-800 bg-slate-900 z-10 w-full relative">
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
            onSubtitleLineDoubleClicked={toggleSubtitleLineStatus}
            onSubtitleLineRemoved={removeSubtitle}
            onCreateCard={(id) => {
              const s = useAppStore.getState().subtitleLines.find(x => x.id === id);
              if (s) handleCreateCard(s).then();
            }}
          />
        </div>
      )}

      {/* Keyboard Shortcuts Handler */}
      <KeyboardShortcutsHandler
        activeSubtitleLineId={activeSubtitleLineId}
        tempSubtitleLine={tempSubtitleLine}
        regionsHidden={regionsHidden}
        isVideoOnly={isVideoOnly}
        setActiveSubtitleLineId={setActiveSubtitleLineId}
        setTempSubtitleLine={setTempSubtitleLine}
        toggleRegionsHidden={() => setRegionsHidden(prev => !prev)}
        setIsVideoOnlyMode={setIsVideoOnlyMode}
        onReplayPressed={(id: number) => handleSubtitleLineClicked(id, false)}
        onCreateCard={() => {
          if (activeSubtitleLineId === null) return;
          const s = subtitleLines.find(x => x.id === activeSubtitleLineId);
          if (s) handleCreateCard(s).then();
        }}
        onJumpNext={() => jumpToSubtitle('next')}
        onJumpPrev={() => jumpToSubtitle('prev')}
        onJumpNextCard={() => {
          if (ankiCards.length === 0) return;
          const nextCard = ankiCards.find(c => c.subtitleId === activeSubtitleLineId)?.id;
          if (nextCard) {
            // Find next card in the list
            const currentIndex = ankiCards.findIndex(c => c.id === nextCard);
            const nextCardIndex = (currentIndex + 1) % ankiCards.length;
            const nextCardItem = ankiCards[nextCardIndex];
            const sub = subtitleLines.find(s => s.id === nextCardItem.subtitleId);
            if (sub) handleSubtitleLineClicked(sub.id, false);
          }
        }}
        onJumpPrevCard={() => {
          if (ankiCards.length === 0) return;
          const nextCard = ankiCards.find(c => c.subtitleId === activeSubtitleLineId)?.id;
          if (nextCard) {
            // Find previous card in the list
            const currentIndex = ankiCards.findIndex(c => c.id === nextCard);
            const prevCardIndex = (currentIndex - 1 + ankiCards.length) % ankiCards.length;
            const prevCardItem = ankiCards[prevCardIndex];
            const sub = subtitleLines.find(s => s.id === prevCardItem.subtitleId);
            if (sub) handleSubtitleLineClicked(sub.id, false);
          }
        }}
        /*
        onToggleLock={() => {
          if (activeSubtitleLineId === null) return;
          toggleSubtitleLock(activeSubtitleLineId);
        }}
        onShiftSubtitles={(offset) => shiftSubtitles(offset)}
         */
        onOpenOrCloseShortcutsModal={() => setIsShortcutsModalOpen(prev => !prev)}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Modals */}
      <TemplateEditorModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)}
                           config={ankiConfig} onSave={setAnkiConfig}/>
      <AnkiConnectSettingsModal isOpen={isAnkiSettingsOpen} onClose={() => setIsAnkiSettingsOpen(false)}
                                url={ankiConnectUrl} onSave={setAnkiConnectUrl}/>
      <CardPreviewModal
        isOpen={!!previewCard}
        card={previewCard ? ankiCards.find(c => c.id === previewCard.id) || previewCard : null}
        onClose={() => setPreviewCard(null)}
      />
      <ShortcutsCheatSheetModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* 全局通知 */}
      {notification.visible && (
        <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-50 bg-slate-700/80 text-slate-200 px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 border border-slate-600">
          "{notification.text.substring(0, 30)}{notification.text.length > 30 ? '...' : ''}" copied!
        </div>
      )}
    </div>
  );
};

export default App;
