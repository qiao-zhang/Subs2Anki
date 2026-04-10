import React, {useState, useRef, useEffect, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {SubtitleLine} from './services/types.ts';
import {serializeSubtitles} from './services/parser.ts';
import {generateAnkiDeck} from './services/export.ts';
import {ffmpegService} from './services/ffmpeg.ts';
import {furiganaService} from './services/furigana.ts';
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
import {useAnkiConnect} from '@/hooks/useAnkiConnect.ts';
import {useKeyboardShortcuts} from "@/hooks/useKeyboardShortcuts.tsx";
import {useNotification} from '@/hooks/app/useNotification.ts';
import {useDeckSelection} from '@/hooks/app/useDeckSelection.ts';
import {useModalState} from '@/hooks/app/useModalState.ts';
import {useSubtitlePlayback} from '@/hooks/app/useSubtitlePlayback.ts';
import {useCardActions} from '@/hooks/app/useCardActions.ts';
import {useSyncActions} from '@/hooks/app/useSyncActions.ts';
import {useProjectActions} from '@/hooks/app/useProjectActions.ts';

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
    updateSubtitleText,  updateSubtitleTime,
    toggleSubtitleLineStatus, setSubtitleLineStatus,
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
  const {isConnectedViaAnkiConnect, decks, tags, isLoadingViaAnkiConnect, refreshDecks, refreshTags} = useAnkiConnect(ankiConnectUrl);

  const {notification, showNotification} = useNotification();

  // --- Selected Deck State ---
  const {selectedDeck, setSelectedDeck} = useDeckSelection({
    projectName,
    decks,
    isConnectedViaAnkiConnect,
    isLoadingViaAnkiConnect,
    t,
    showNotification,
  });

  // --- Global Tags State ---
  const [globalTags, setGlobalTags] = useState<string[]>([]);

  // --- Local UI State (Transient) ---
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // noinspection JSUnusedLocalSymbols
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [regionsHidden, setRegionsHidden] = useState<boolean>(false);
  const [isVideoOnly, setIsVideoOnlyMode] = useState<boolean>(false);

  // Modals
  const {
    isTemplateModalOpen,
    setIsTemplateModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    previewCard,
    setPreviewCard,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
  } = useModalState();

  // Refs
  const videoPlayerRef = useRef<VideoPlayerHandle | null>(null);

  const {
    pauseAtTime,
    setPauseAtTime,
    currentTime,
    activeSubtitleLineId,
    setActiveSubtitleLineId,
    currentSubtitleText,
    tempSubtitleLine,
    setTempSubtitleLine,
    playTimeSpan,
    playEdge,
    jumpToSubtitleLine,
    handleTempSubtitleLineCreated,
    handleTempSubtitleLineUpdated,
    handleTempSubtitleLineRemoved,
    handleTempSubtitleLineClicked,
    handleCommitTempSubtitleLine,
    handleTimeUpdate,
    handleSeek,
    handleSubtitleLineClicked,
    handleSubtitleLineUpdated,
  } = useSubtitlePlayback({
    subtitleLines,
    getSubtitleLine,
    updateSubtitleTime,
    addSubtitleLine,
    videoPlayerRef,
  });

  const {
    isBulkCreating,
    bulkCreateProgress,
    handleCreateCard,
    handleBulkCreateCards,
    deleteScreenshotAndAudioForCard,
    handleDeleteCard,
  } = useCardActions({
    projectName,
    globalTags,
    bulkCreateLimit,
    subtitleLines,
    getSubtitleLine,
    addCard,
    setSubtitleLineStatus,
    ankiCards,
    deleteCard,
    showNotification,
    t,
    videoPlayerRef,
    convertToFurigana: (text: string) => furiganaService.convert(text),
  });

  const {
    isSyncing,
    syncProgress,
    handleSyncCard,
    handleSyncCards,
  } = useSyncActions({
    ankiCards,
    ankiConnectUrl,
    projectName,
    ankiConfig,
    globalTags,
    selectedDeck,
    autoDeleteSynced,
    updateCardSyncStatus,
    handleDeleteCard,
    openSettings: () => setIsSettingsModalOpen(true),
    showNotification,
    t,
  });

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
    onReplay(): void {
      if (activeSubtitleLineId !== null) {
        handleSubtitleLineClicked(activeSubtitleLineId);
        return;
      }
      if (tempSubtitleLine !== null) {
        playTimeSpan(tempSubtitleLine.start, tempSubtitleLine.end);
        return;
      }
      // If no active or temp subtitle line, act as onPlay
      videoPlayerRef.current?.playPause();
    },
    onPlay: () => {
      setActiveSubtitleLineId(null);
      setTempSubtitleLine(null);
      videoPlayerRef.current?.playPause();
    },
    onPlayHead: () => {
      if (activeSubtitleLineId !== null) {
        const sub = getSubtitleLine(activeSubtitleLineId);
        if (!sub) return;
        if (!videoPlayerRef.current) return;
        playEdge(sub.startTime, sub.endTime, "start");
        return;
      }
      if (tempSubtitleLine !== null) {
        playEdge(tempSubtitleLine.start, tempSubtitleLine.end, "start");
        return;
      }
    },
    onPlayTail: () => {
      if (activeSubtitleLineId !== null) {
        const sub = getSubtitleLine(activeSubtitleLineId);
        if (!sub) return;
        if (!videoPlayerRef.current) return;
        playEdge(sub.startTime, sub.endTime, "end");
        return;
      }
      if (tempSubtitleLine !== null) {
        playEdge(tempSubtitleLine.start, tempSubtitleLine.end, "end");
        return;
      }
    },
    onCreateCard: async () => {
      if (activeSubtitleLineId === null) return;
      await handleCreateCard(activeSubtitleLineId);
    },
    onJumpNext: () => jumpToSubtitleLine('next'),
    onJumpPrev: () => jumpToSubtitleLine('prev'),
    onToggleStatusOfActiveSubtitleLine: (order: 'forward' | 'backward') => {
      if (activeSubtitleLineId === null) return;
      if (order === 'forward') {
        toggleSubtitleLineStatus(activeSubtitleLineId);
      } else {
        toggleSubtitleLineStatus(activeSubtitleLineId, 'NLI');
      }
    },
    onDeleteActiveSubtitleLine: () => {
      if (activeSubtitleLineId === null) return;
      removeSubtitle(activeSubtitleLineId);
      setActiveSubtitleLineId(null);
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

  const handleSubtitleLineShiftClicked = (id: number) => {
    const sub = getSubtitleLine(id);
    if (!sub) return;

    // 复制字幕文本到剪贴板
    navigator.clipboard.writeText(sub.text).then(() => {
      // 显示复制成功的提示
      showNotification(t("notifications.copiedToClipboard", {
        defaultValue: '"{{text}}" copied to clipboard',
        text: sub.text
      }));
    }).catch(err => {
      console.error('Cannot copy text:', err);
    });
  }

  const handleExportApkg = async () => {
    setIsExporting(true);
    await generateAnkiDeck(ankiCards, globalTags, projectName, ankiConfig);
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

  const resetStoreState = useCallback(() => {
    setProjectName('');
    resetVideo();
    setSubtitles([], '');

    setPauseAtTime(null);
    setActiveSubtitleLineId(null);
    setTempSubtitleLine(null);

    setIsExporting(false);

    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(0);
      videoPlayerRef.current = null;
    }

    setRegionsHidden(false);
    setIsVideoOnlyMode(false);

    ankiCards.forEach(async card => await deleteScreenshotAndAudioForCard(card.id));
    clearCards();

    setSelectedDeck('Subs2Anki Export');
    setGlobalTags([]);

    setIsTemplateModalOpen(false);
    setIsSettingsModalOpen(false);
    setPreviewCard(null);
    setIsShortcutsModalOpen(false);
  }, [
    ankiCards,
    clearCards,
    deleteScreenshotAndAudioForCard,
    resetVideo,
    setActiveSubtitleLineId,
    setIsSettingsModalOpen,
    setIsShortcutsModalOpen,
    setIsTemplateModalOpen,
    setPauseAtTime,
    setPreviewCard,
    setProjectName,
    setSelectedDeck,
    setSubtitles,
    setTempSubtitleLine,
  ]);

  const {
    handleSaveProject,
    handleLoadProject,
    handleResetProject,
  } = useProjectActions({
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
    setHasUnsavedChanges,
    showNotification,
    t,
    resetStoreState,
  });

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
          onRefreshAnkiConnection={async () => {await refreshDecks(); await refreshTags();}}
          onOpenAnkiSettings={() => setIsSettingsModalOpen(true)}
          onDeleteSynced={handleDeleteSyncedCards}
          isConnected={isConnectedViaAnkiConnect}
          decks={decks}
          ankiTags={tags}
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
          onBulkCreateLimitChange={setBulkCreateLimit}
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
        className={`h-40 flex-shrink-0 border-t border-slate-800 bg-slate-900 z-10 w-full relative ${isVideoOnly ? 'hidden' : ''}`}>
        <WaveformDisplay
          videoElement={videoPlayerRef.current?.getVideoElement() || null}
          videoSrc={videoSrc}
          currentTime={currentTime}
          onSeek={handleSeek}
          regionsHidden={regionsHidden}
          tempSubtitleLine={tempSubtitleLine}
          onTempSubtitleLineCreated={handleTempSubtitleLineCreated}
          onTempSubtitleLineUpdated={handleTempSubtitleLineUpdated}
          onTempSubtitleLineClicked={handleTempSubtitleLineClicked}
          onTempSubtitleLineRemoved={handleTempSubtitleLineRemoved}
          onSubtitleLineClicked={handleSubtitleLineClicked}
          onSubtitleLineShiftClicked={handleSubtitleLineShiftClicked}
          onSubtitleLineUpdated={handleSubtitleLineUpdated}
          onSubtitleLineRemoved={removeSubtitle}
          numOfNormalRegionsToHighlight={showBulkCreateButton ? bulkCreateLimit : 0}
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
