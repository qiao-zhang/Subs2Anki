import React from 'react';
import TempSubtitleLineControls from './controls/TempSubtitleLineControls';
import ActiveSubtitleLineControls from './controls/ActiveSubtitleLineControls';
import DefaultControls from './controls/DefaultControls';

interface AppControlBarProps {
  tempSubtitleLine: {start: number, end: number} | null;
  activeSubtitleLineId: number | null;
  videoName: string;
  currentTime: number;
  onTempPlay: () => void;
  onTempCommit: () => void;
  onTempDiscard: () => void;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReplayActive: () => void;
  onShiftSubtitles: (offset: number) => void;
  onCaptureFrame: () => void;
  onDownloadAudio: () => void;
}

const AppControlBar: React.FC<AppControlBarProps> = ({
                                                       tempSubtitleLine,
                                                       activeSubtitleLineId,
                                                       videoName,
                                                       currentTime,
                                                       onTempPlay,
                                                       onTempCommit,
                                                       onTempDiscard,
                                                       onVideoUpload,
                                                       onReplayActive,
                                                       onShiftSubtitles,
                                                       onCaptureFrame,
                                                       onDownloadAudio
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

  if (activeSubtitleLineId !== null) {
    return (
      <ActiveSubtitleLineControls
        videoName={videoName}
        currentTime={currentTime}
        onVideoUpload={onVideoUpload}
        onPlay={onReplayActive}
        onDownloadAudio={onDownloadAudio}
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
