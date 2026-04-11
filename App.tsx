import React, {useState, useRef, useEffect, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {generateAnkiDeck} from './services/export.ts';
import {furiganaService} from './services/furigana.ts';
import {VideoPlayerHandle} from '@/components/VideoPlayer.tsx';
import {useAppStore} from '@/services/store.ts';
import {useMediaProcessing} from '@/hooks/useMediaProcessing.ts';
import {useAnkiConnect} from '@/hooks/useAnkiConnect.ts';
import {useKeyboardShortcuts} from "@/hooks/useKeyboardShortcuts.tsx";
import {useNotification} from '@/hooks/app/useNotification.ts';
import {useDeckSelection} from '@/hooks/app/useDeckSelection.ts';
import {useModalState} from '@/hooks/app/useModalState.ts';
import {useSubtitlePlayback} from '@/hooks/app/useSubtitlePlayback.ts';
import {useCardActions} from '@/hooks/app/useCardActions.ts';
import {useSyncActions} from '@/hooks/app/useSyncActions.ts';
import {useProjectActions} from '@/hooks/app/useProjectActions.ts';
import {useAppUtilityActions} from '@/hooks/app/useAppUtilityActions.ts';
import {useResetStoreState} from '@/hooks/app/useResetStoreState.ts';
import AppOverlays from '@/components/app/AppOverlays.tsx';
import AppMainLayout from '@/components/app/AppMainLayout.tsx';
import AppModals from '@/components/app/AppModals.tsx';

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

  const {
    handleVideoUpload,
    handleSaveSubtitles,
    handleDownloadSubtitles,
    handleSubtitleLineShiftClicked,
    handleCaptureFrame,
    handleDeleteSyncedCards,
    handleDownloadAudio,
  } = useAppUtilityActions({
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
  });

  const handleExportApkg = async () => {
    setIsExporting(true);
    await generateAnkiDeck(ankiCards, globalTags, projectName, ankiConfig);
    setIsExporting(false);
  }

  const resetStoreState = useResetStoreState({
    ankiCards,
    clearCards,
    deleteScreenshotAndAudioForCard,
    resetVideo,
    setProjectName,
    setSubtitles,
    setPauseAtTime,
    setActiveSubtitleLineId,
    setTempSubtitleLine,
    setIsExporting,
    setRegionsHidden,
    setIsVideoOnlyMode,
    setSelectedDeck,
    setGlobalTags,
    setIsTemplateModalOpen,
    setIsSettingsModalOpen,
    setPreviewCard,
    setIsShortcutsModalOpen,
    videoPlayerRef,
  });

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

  const handleRefreshAnkiConnection = useCallback(async () => {
    await refreshDecks();
    await refreshTags();
  }, [refreshDecks, refreshTags]);

  return <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden relative">
      <AppOverlays
        isSyncing={isSyncing}
        syncProgress={syncProgress}
        isBulkCreating={isBulkCreating}
        bulkCreateProgress={bulkCreateProgress}
        isExporting={isExporting}
        pendingMediaCount={ankiCards.filter(c => c.audioStatus !== 'done').length}
        onCancelExport={() => setIsExporting(false)}
      />

      <AppMainLayout
        isVideoOnly={isVideoOnly}
        videoPlayerRef={videoPlayerRef}
        ankiCards={ankiCards}
        onDeleteCard={handleDeleteCard}
        onPreviewCard={setPreviewCard}
        onSyncCard={(id) => handleSyncCard(id, selectedDeck)}
        onSyncCards={handleSyncCards}
        onOpenTemplateSettings={() => setIsTemplateModalOpen(true)}
        onExport={handleExportApkg}
        onRefreshAnkiConnection={handleRefreshAnkiConnection}
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
        onProjectNameChange={setProjectName}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onResetProject={handleResetProject}
        hasProjectData={hasProjectData}
        videoSrc={videoSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setIsVideoReady(true)}
        currentSubtitleText={currentSubtitleText}
        subtitleLines={subtitleLines}
        activeSubtitleLineId={activeSubtitleLineId}
        subtitleFileName={subtitleFileName}
        canSave={fileHandle !== null}
        onSetSubtitles={setSubtitles}
        onSubtitleLineClicked={handleSubtitleLineClicked}
        onToggleLock={toggleSubtitleLineStatus}
        onCreateCard={handleCreateCard}
        onBulkCreateCards={handleBulkCreateCards}
        onSaveSubtitles={handleSaveSubtitles}
        onDownloadSubtitles={handleDownloadSubtitles}
        onShiftSubtitles={shiftSubtitles}
        showBulkCreateButton={showBulkCreateButton}
        bulkCreateLimit={bulkCreateLimit}
        onBulkCreateLimitChange={setBulkCreateLimit}
        tempSubtitleLine={tempSubtitleLine}
        currentTime={currentTime}
        onTempCommit={handleCommitTempSubtitleLine}
        videoName={videoName}
        onVideoUpload={handleVideoUpload}
        onCaptureFrame={handleCaptureFrame}
        onDownloadAudio={handleDownloadAudio}
        onUpdateSubtitleText={updateSubtitleText}
        onSeek={handleSeek}
        regionsHidden={regionsHidden}
        onTempSubtitleLineCreated={handleTempSubtitleLineCreated}
        onTempSubtitleLineUpdated={handleTempSubtitleLineUpdated}
        onTempSubtitleLineClicked={handleTempSubtitleLineClicked}
        onTempSubtitleLineRemoved={handleTempSubtitleLineRemoved}
        onSubtitleLineShiftClicked={handleSubtitleLineShiftClicked}
        onSubtitleLineUpdated={handleSubtitleLineUpdated}
        onSubtitleLineRemoved={removeSubtitle}
      />

      <AppModals
        isTemplateModalOpen={isTemplateModalOpen}
        onCloseTemplate={() => setIsTemplateModalOpen(false)}
        ankiConfig={ankiConfig}
        onSaveAnkiConfig={setAnkiConfig}
        isSettingsModalOpen={isSettingsModalOpen}
        onCloseSettings={() => setIsSettingsModalOpen(false)}
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
        ankiCards={ankiCards}
        previewCard={previewCard}
        onClosePreview={() => setPreviewCard(null)}
        isShortcutsModalOpen={isShortcutsModalOpen}
        onCloseShortcuts={() => setIsShortcutsModalOpen(false)}
      />

      {notification.visible && (<div
        className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-50 bg-slate-700/80 text-slate-200 px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 border border-slate-600">
          {notification.text.substring(0, 30)}{notification.text.length > 30 ? '...' : ''}
        </div>)}
    </div>;
};

export default App;
