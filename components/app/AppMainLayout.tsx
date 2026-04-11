import React, {MutableRefObject} from 'react';
import {AnkiCard, SubtitleLine} from '@/services/types.ts';
import VideoPlayer, {VideoPlayerHandle} from '@/components/VideoPlayer.tsx';
import WaveformDisplay from '@/components/WaveformDisplay.tsx';
import DeckColumn from '@/components/DeckColumn.tsx';
import SubtitleColumn from '@/components/SubtitleColumn.tsx';
import AppControlBar from '@/components/AppControlBar.tsx';
import EditableProjectName from '@/components/EditableProjectName.tsx';
import ProjectControls from '@/components/ProjectControls.tsx';

interface AppMainLayoutProps {
  isVideoOnly: boolean;
  videoPlayerRef: MutableRefObject<VideoPlayerHandle | null>;

  ankiCards: AnkiCard[];
  onDeleteCard: (id: string) => Promise<void>;
  onPreviewCard: (card: AnkiCard) => void;
  onSyncCard: (id: string) => void;
  onSyncCards: () => Promise<void>;
  onOpenTemplateSettings: () => void;
  onExport: () => Promise<void>;
  onRefreshAnkiConnection: () => Promise<void>;
  onOpenAnkiSettings: () => void;
  onDeleteSynced: () => Promise<void>;
  isConnected: boolean;
  decks: string[];
  ankiTags: string[];
  ankiConnectUrl: string;
  projectName: string;
  selectedDeck: string;
  onDeckChange: (deckName: string) => void;
  globalTags: string[];
  onGlobalTagsChange: (tags: string[]) => void;

  onProjectNameChange: (name: string) => void;
  onSaveProject: () => Promise<void>;
  onLoadProject: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onOpenSettings: () => void;
  onResetProject: () => void;
  hasProjectData: boolean;

  videoSrc: string;
  onTimeUpdate: (time: number) => void;
  onLoadedMetadata: () => void;
  currentSubtitleText: string;

  subtitleLines: SubtitleLine[];
  activeSubtitleLineId: number | null;
  subtitleFileName: string;
  canSave: boolean;
  onSetSubtitles: (lines: SubtitleLine[], fileName: string) => void;
  onSubtitleLineClicked: (id: number) => void;
  onToggleLock: (id: number, order?: 'NIL' | 'NLI') => void;
  onCreateCard: (id: number) => Promise<void>;
  onBulkCreateCards: () => Promise<void>;
  onSaveSubtitles: () => Promise<void>;
  onDownloadSubtitles: () => Promise<void>;
  onShiftSubtitles: (offset: number) => void;
  showBulkCreateButton: boolean;
  bulkCreateLimit: number;
  onBulkCreateLimitChange: (limit: number) => void;

  tempSubtitleLine: { start: number, end: number } | null;
  currentTime: number;
  onTempCommit: (text: string) => void;
  videoName: string;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCaptureFrame: () => Promise<void>;
  onDownloadAudio: () => Promise<void>;
  onUpdateSubtitleText: (id: number, text: string) => void;

  onSeek: (time: number) => void;
  regionsHidden: boolean;
  onTempSubtitleLineCreated: (start: number, end: number) => void;
  onTempSubtitleLineUpdated: (start: number, end: number, side?: 'start' | 'end') => void;
  onTempSubtitleLineClicked: (start: number, end: number) => void;
  onTempSubtitleLineRemoved: () => void;
  onSubtitleLineShiftClicked: (id: number) => void;
  onSubtitleLineUpdated: (id: number, start: number, end: number) => void;
  onSubtitleLineRemoved: (id: number) => void;
}

const AppMainLayout: React.FC<AppMainLayoutProps> = ({
  isVideoOnly,
  videoPlayerRef,
  ankiCards,
  onDeleteCard,
  onPreviewCard,
  onSyncCard,
  onSyncCards,
  onOpenTemplateSettings,
  onExport,
  onRefreshAnkiConnection,
  onOpenAnkiSettings,
  onDeleteSynced,
  isConnected,
  decks,
  ankiTags,
  ankiConnectUrl,
  projectName,
  selectedDeck,
  onDeckChange,
  globalTags,
  onGlobalTagsChange,
  onProjectNameChange,
  onSaveProject,
  onLoadProject,
  onOpenSettings,
  onResetProject,
  hasProjectData,
  videoSrc,
  onTimeUpdate,
  onLoadedMetadata,
  currentSubtitleText,
  subtitleLines,
  activeSubtitleLineId,
  subtitleFileName,
  canSave,
  onSetSubtitles,
  onSubtitleLineClicked,
  onToggleLock,
  onCreateCard,
  onBulkCreateCards,
  onSaveSubtitles,
  onDownloadSubtitles,
  onShiftSubtitles,
  showBulkCreateButton,
  bulkCreateLimit,
  onBulkCreateLimitChange,
  tempSubtitleLine,
  currentTime,
  onTempCommit,
  videoName,
  onVideoUpload,
  onCaptureFrame,
  onDownloadAudio,
  onUpdateSubtitleText,
  onSeek,
  regionsHidden,
  onTempSubtitleLineCreated,
  onTempSubtitleLineUpdated,
  onTempSubtitleLineClicked,
  onTempSubtitleLineRemoved,
  onSubtitleLineShiftClicked,
  onSubtitleLineUpdated,
  onSubtitleLineRemoved,
}) => {
  return (
    <>
      <div className="flex flex-1 min-h-0 w-full">
        <DeckColumn
          cards={ankiCards}
          onDelete={onDeleteCard}
          onPreview={onPreviewCard}
          onSyncCard={onSyncCard}
          onSyncCards={onSyncCards}
          onOpenTemplateSettings={onOpenTemplateSettings}
          onExport={onExport}
          onRefreshAnkiConnection={onRefreshAnkiConnection}
          onOpenAnkiSettings={onOpenAnkiSettings}
          onDeleteSynced={onDeleteSynced}
          isConnected={isConnected}
          decks={decks}
          ankiTags={ankiTags}
          ankiConnectUrl={ankiConnectUrl}
          projectName={projectName}
          selectedDeck={selectedDeck}
          onDeckChange={onDeckChange}
          globalTags={globalTags}
          onGlobalTagsChange={onGlobalTagsChange}
          className={`${isVideoOnly ? 'hidden' : ''}`}
        />

        <main className="flex-1 flex flex-col bg-slate-950 relative min-w-0">
          {!isVideoOnly &&
            <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
              <EditableProjectName
                projectName={projectName}
                onProjectNameChange={onProjectNameChange}
                className="text-lg font-semibold"
              />
              <ProjectControls
                onSaveProject={onSaveProject}
                onLoadProject={onLoadProject}
                onOpenSettings={onOpenSettings}
                onResetProject={onResetProject}
                hasProjectData={hasProjectData}
              />
            </div>
          }

          <div className="flex-1 flex flex-col items-center justify-center p-2 bg-black/20 min-h-0">
            <div className="w-full h-full max-w-5xl flex flex-col justify-center">
              <VideoPlayer
                ref={videoPlayerRef}
                src={videoSrc}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
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
          canSave={canSave}
          onSetSubtitles={onSetSubtitles}
          onSubtitleLineClicked={onSubtitleLineClicked}
          onToggleLock={onToggleLock}
          onCreateCard={onCreateCard}
          onBulkCreateCards={onBulkCreateCards}
          onSave={onSaveSubtitles}
          onDownload={onDownloadSubtitles}
          onShiftSubtitles={onShiftSubtitles}
          showBulkCreateButton={showBulkCreateButton}
          bulkCreateLimit={bulkCreateLimit}
          onBulkCreateLimitChange={onBulkCreateLimitChange}
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
            onTempCommit={onTempCommit}
            onVideoUpload={onVideoUpload}
            onCaptureFrame={onCaptureFrame}
            onDownloadAudio={onDownloadAudio}
            onUpdateSubtitleText={onUpdateSubtitleText}
          />
        </div>
      )}

      <div
        className={`h-40 flex-shrink-0 border-t border-slate-800 bg-slate-900 z-10 w-full relative ${isVideoOnly ? 'hidden' : ''}`}>
        <WaveformDisplay
          videoElement={videoPlayerRef.current?.getVideoElement() || null}
          videoSrc={videoSrc}
          currentTime={currentTime}
          onSeek={onSeek}
          regionsHidden={regionsHidden}
          tempSubtitleLine={tempSubtitleLine}
          onTempSubtitleLineCreated={onTempSubtitleLineCreated}
          onTempSubtitleLineUpdated={onTempSubtitleLineUpdated}
          onTempSubtitleLineClicked={onTempSubtitleLineClicked}
          onTempSubtitleLineRemoved={onTempSubtitleLineRemoved}
          onSubtitleLineClicked={onSubtitleLineClicked}
          onSubtitleLineShiftClicked={onSubtitleLineShiftClicked}
          onSubtitleLineUpdated={onSubtitleLineUpdated}
          onSubtitleLineRemoved={onSubtitleLineRemoved}
          numOfNormalRegionsToHighlight={showBulkCreateButton ? bulkCreateLimit : 0}
        />
      </div>
    </>
  );
};

export default AppMainLayout;

