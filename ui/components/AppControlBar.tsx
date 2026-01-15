
import React from 'react';
import TempSubtitleLineControls from './controls/TempSubtitleLineControls';
import ActiveSubtitleLineControls from './controls/ActiveSubtitleLineControls';
import DefaultControls from './controls/DefaultControls';
import { SubtitleLine } from '../../core/types';

interface AppControlBarProps {
  tempSubtitleLine: {start: number, end: number} | null;
  activeSubtitleLine: SubtitleLine | null;
  videoName: string;
  currentTime: number;
  onTempPlay: () => void;
  onTempCommit: (text: string) => void;
  onTempDiscard: () => void;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReplayActive: () => void;
  onShiftSubtitles: (offset: number) => void;
  onCaptureFrame: () => void;
  onDownloadAudio: () => void;
  onUpdateSubtitleText: (id: number, text: string) => void;
  onDeleteSubtitle: (id: number) => void;
}

const AppControlBar: React.FC<AppControlBarProps> = ({
                                                       tempSubtitleLine,
                                                       activeSubtitleLine,
                                                       videoName,
                                                       currentTime,
                                                       onTempPlay,
                                                       onTempCommit,
                                                       onTempDiscard,
                                                       onVideoUpload,
                                                       onReplayActive,
                                                       onShiftSubtitles,
                                                       onCaptureFrame,
                                                       onDownloadAudio,
                                                       onUpdateSubtitleText,
                                                       onDeleteSubtitle
                                                     }) => {
  if (tempSubtitleLine) {
    return (
      <TempSubtitleLineControls
        start={tempSubtitleLine.start}
        end={tempSubtitleLine.end}
        onPlay={onTempPlay}
        onCommit={onTempCommit}
        onDiscard={onTempDiscard}
        onDownloadAudio={onDownloadAudio}
      />
    );
  }

  if (activeSubtitleLine) {
    return (
      <ActiveSubtitleLineControls
        videoName={videoName}
        currentTime={currentTime}
        subtitle={activeSubtitleLine}
        onVideoUpload={onVideoUpload}
        onPlay={onReplayActive}
        onDownloadAudio={onDownloadAudio}
        onTextChange={onUpdateSubtitleText}
        onDelete={onDeleteSubtitle}
      />
    );
  }

  return (
    <DefaultControls
      videoName={videoName}
      currentTime={currentTime}
      onVideoUpload={onVideoUpload}
      onShiftSubtitles={onShiftSubtitles}
      onCaptureFrame={onCaptureFrame}
    />
  );
};

export default AppControlBar;
