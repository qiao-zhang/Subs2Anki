import React, {useState, useRef, useEffect, useCallback} from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import {useTranslation} from 'react-i18next';
import {SubtitleLine, AnkiCard} from './services/types.ts';
import {ffmpegService} from './services/ffmpeg.ts';
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
import ShortcutsCheatSheetModal from '@/components/modals/ShortcutsCheatSheetModal.tsx';
import {useAnkiConnect} from '@/hooks/useAnkiConnect.ts';
import { useDesktopFfmpegStatus } from '@/hooks/useDesktopFfmpegStatus.ts';
import { useAnkiSync } from '@/hooks/useAnkiSync.ts';
import { useProjectPersistence } from '@/hooks/useProjectPersistence.ts';
import { useProjectReset } from '@/hooks/useProjectReset.ts';
import { useCardCreationFlow } from '@/hooks/useCardCreationFlow.ts';
import { useSubtitlePlaybackSelection } from '@/hooks/useSubtitlePlaybackSelection.ts';
import { useSubtitleKeyboardActions } from '@/hooks/useSubtitleKeyboardActions.ts';
import { useMediaExportActions } from '@/hooks/useMediaExportActions.ts';
import { useProjectUiState } from '@/hooks/useProjectUiState.ts';
import { useSubtitleTimelineHandlers } from '@/hooks/useSubtitleTimelineHandlers.ts';
import { useCardMediaDeletion } from '@/hooks/useCardMediaDeletion.ts';
import AppStatusBanners from '@/components/AppStatusBanners.tsx';
import AppProcessingOverlays from '@/components/AppProcessingOverlays.tsx';
import AppNotificationToast from '@/components/AppNotificationToast.tsx';

const App: React.FC = () => {
  // 初始化i18n翻译
  const {t} = useTranslation();
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = useCallback((text: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
    setNotification({visible: true, text});
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification({visible: false, text: ''});
      notificationTimeoutRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // --- Global State from Zustand ---
  const {
    videoSrc, videoName, projectName, videoFile, videoPath, setVideo, setTauriVideo, resetVideo,
    setProjectName,
    subtitleLines, subtitleFileName, fileHandle, subtitlePath,
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
  const {isConnected, decks, tags, refreshDecks} = useAnkiConnect(ankiConnectUrl);

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
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeSubtitleLineId, setActiveSubtitleLineId] = useState<number | null>(null);
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>(''); // 当前字幕文本

  const [notification, setNotification] = useState<{ visible: boolean; text: string }>({visible: false, text: ''});

  const {
    desktopFfmpegStatus,
    isDesktopFfmpegCheckPending,
    isDesktopFfmpegAvailable,
    desktopFfmpegMessage,
    refreshDesktopFfmpegStatus,
    ensureDesktopFfmpegReady,
  } = useDesktopFfmpegStatus({ showNotification });

  const {
    isSyncing,
    syncProgress,
    syncCard,
    syncCards,
  } = useAnkiSync({
    ankiCards,
    ankiConnectUrl,
    ankiConfig,
    selectedDeck,
    globalTags,
    projectName,
    autoDeleteSynced,
    onDeleteCard: async (id) => handleDeleteCard(id),
    onOpenSettings: () => setIsSettingsModalOpen(true),
    onUpdateCardSyncStatus: updateCardSyncStatus,
    showNotification,
  });

  const {
    handleSaveProject,
    handleLoadProject,
  } = useProjectPersistence({
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
  });

  const {
    isVideoReady,
    setIsVideoReady,
    regionsHidden,
    setRegionsHidden,
    isVideoOnly,
    setIsVideoOnlyMode,
    isTemplateModalOpen,
    setIsTemplateModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    previewCard,
    setPreviewCard,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    resetViewModes,
    closeTransientUi,
  } = useProjectUiState();

  const [tempSubtitleLine, setTempSubtitleLine] = useState<{ start: number, end: number } | null>(null);

  // Refs
  const videoPlayerRef = useRef<VideoPlayerHandle | null>(null);

  const {
    isBulkCreating,
    bulkCreateProgress,
    handleCreateCard,
    handleBulkCreateCards,
    resetBulkCreationState,
  } = useCardCreationFlow({
    subtitleLines,
    projectName,
    globalTags,
    bulkCreateLimit,
    desktopFfmpegStatus,
    desktopFfmpegMessage,
    getSubtitleLine,
    getVideoPlayerHandle: () => videoPlayerRef.current,
    addCard,
    setSubtitleLineStatus,
    showNotification,
  });

  const {
    pauseAtTime,
    playTimeSpan,
    playEdge,
    playUpdatedSpan,
    handleSeek,
    handleSubtitleLineClicked,
    handleTempSubtitleLineCreated,
    clearPauseAtTime,
    resetPlaybackSelectionState,
  } = useSubtitlePlaybackSelection({
    getVideoPlayerHandle: () => videoPlayerRef.current,
    getSubtitleLine,
    setActiveSubtitleLineId,
    setTempSubtitleLine,
  });

  const {
    isExporting,
    handleCancelExport,
    handleSaveSubtitles,
    handleDownloadSubtitles,
    handleExportApkg,
    handleCaptureFrame,
    handleDownloadAudio,
  } = useMediaExportActions({
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
    getVideoPlayerHandle: () => videoPlayerRef.current,
    getSubtitleLine,
    showNotification,
  });

  const {
    deleteScreenshotAndAudioForCard,
    handleDeleteCard,
    handleDeleteSyncedCards,
  } = useCardMediaDeletion({
    ankiCards,
    deleteCard,
    showNotification,
    t,
  });

  const {
    handleTempSubtitleLineUpdated,
    handleTempSubtitleLineRemoved,
    handleTempSubtitleLineClicked,
    handleCommitTempSubtitleLine,
    handleTimeUpdate,
    handleSubtitleLineShiftClicked,
    handleSubtitleLineUpdated,
  } = useSubtitleTimelineHandlers({
    subtitleLines,
    activeSubtitleLineId,
    tempSubtitleLine,
    pauseAtTime,
    getVideoPlayerHandle: () => videoPlayerRef.current,
    getSubtitleLine,
    playTimeSpan,
    playEdge,
    playUpdatedSpan,
    clearPauseAtTime,
    addSubtitleLine,
    updateSubtitleTime,
    setCurrentTime,
    setActiveSubtitleLineId,
    setCurrentSubtitleText,
    setTempSubtitleLine,
    showNotification,
    t,
  });

  const {
    handleResetProject,
  } = useProjectReset({
    ankiCards,
    setProjectName,
    resetVideo,
    setSubtitles,
    setHasUnsavedChanges,
    clearCards,
    setSelectedDeck,
    setGlobalTags,
    deleteScreenshotAndAudioForCard: async (id) => deleteScreenshotAndAudioForCard(id),
    resetUiState: () => {
      resetPlaybackSelectionState();
      setCurrentTime(0);
      setActiveSubtitleLineId(null);
      setCurrentSubtitleText('');
      setTempSubtitleLine(null);
      resetViewModes();
    },
    resetProcessingState: () => {
      handleCancelExport();
      resetBulkCreationState();
    },
    resetVideoPlayerState: () => {
      if (videoPlayerRef.current) {
        videoPlayerRef.current.seekTo(0);
        videoPlayerRef.current = null;
      }
    },
    closeTransientUi,
    showNotification,
  });

  // Reset video ready state when src changes
  useEffect(() => {
    setIsVideoReady(false);
  }, [videoSrc]);

  useEffect(() => {
    ffmpegService.prepareVideoSource({ file: videoFile, path: videoPath }).catch((error) => {
      console.debug('[App] Failed to prepare video for audio extraction', error);
    });
  }, [videoFile, videoPath]);

  // --- Background Media Processing ---
  useMediaProcessing(
    { file: videoFile, path: videoPath },
    previewCard,
    isDesktopFfmpegAvailable
  );

  useSubtitleKeyboardActions({
    subtitleLines,
    activeSubtitleLineId,
    currentTime,
    tempSubtitleLine,
    regionsHidden,
    isVideoOnly,
    getSubtitleLine,
    toggleSubtitleLineStatus,
    removeSubtitle,
    breakUpSubtitleLine,
    mergeSubtitleLines,
    canUndo,
    canRedo,
    undo,
    redo,
    handleCreateCard,
    handleSubtitleLineClicked,
    playTimeSpan,
    playEdge,
    setActiveSubtitleLineId,
    setTempSubtitleLine,
    setRegionsHidden,
    setIsVideoOnlyMode,
    setIsShortcutsModalOpen,
    setIsSettingsModalOpen,
    getVideoPlayerHandle: () => videoPlayerRef.current,
  });

  // --- Handlers ---
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideo(file);
    }
  };

  const handlePickVideo = async () => {
    if (!__TAURI_BUILD__) {
      return;
    }

    try {
      const path = await invoke<string | null>('pick_video_file');
      if (!path) {
        return;
      }

      setTauriVideo(path, convertFileSrc(path));
    } catch (error) {
      console.debug('[App] Failed to pick Tauri video file', error);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden relative">
      <AppStatusBanners
        desktopFfmpegMessage={desktopFfmpegMessage}
        desktopFfmpegStatus={desktopFfmpegStatus}
        isDesktopFfmpegCheckPending={isDesktopFfmpegCheckPending}
      />
      <AppProcessingOverlays
        isSyncing={isSyncing}
        syncProgress={syncProgress}
        isBulkCreating={isBulkCreating}
        bulkCreateProgress={bulkCreateProgress}
        isExporting={isExporting}
        ankiCards={ankiCards}
        onCancelExport={handleCancelExport}
      />

      <div className="flex flex-1 min-h-0 w-full">
        <DeckColumn
          cards={ankiCards}
          onDelete={handleDeleteCard}
          onPreview={(c) => setPreviewCard(c)}
          onSyncCard={(id) => syncCard(id, selectedDeck)}
          onSyncCards={syncCards}
          onOpenTemplateSettings={() => setIsTemplateModalOpen(true)}
          onExport={handleExportApkg}
          onOpenAnkiSettings={() => setIsSettingsModalOpen(true)}
          onDeleteSynced={handleDeleteSyncedCards}
          isConnected={isConnected}
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

        <main className="flex-1 flex flex-col bg-slate-950 relative min-w-0">
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

        <SubtitleColumn
          className={`${isVideoOnly ? 'hidden' : ''}`}
          subtitleLines={subtitleLines}
          activeSubtitleLineId={activeSubtitleLineId}
          subtitleFileName={subtitleFileName}
          canSave={fileHandle !== null || subtitlePath !== null}
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
            onPickVideo={handlePickVideo}
            onCaptureFrame={handleCaptureFrame}
            onDownloadAudio={handleDownloadAudio}
            onUpdateSubtitleText={updateSubtitleText}
          />
        </div>
      )}

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
        ffmpegStatus={desktopFfmpegStatus}
        isFfmpegCheckPending={isDesktopFfmpegCheckPending}
        onRecheckFfmpeg={() => refreshDesktopFfmpegStatus(true)}
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

      <AppNotificationToast visible={notification.visible} text={notification.text} />
    </div>
  );
};

export default App;
