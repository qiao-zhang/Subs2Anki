import React from 'react';
import TempSubtitleLineControls from './controls/TempSubtitleLineControls';
import ActiveSubtitleLineControls from './controls/ActiveSubtitleLineControls';
import DefaultControls from './controls/DefaultControls';
import {SubtitleLine} from '../../core/types';

interface AppControlBarProps {
  tempSubtitleLine: { start: number, end: number } | null;
  activeSubtitleLine: SubtitleLine | null;
  videoName: string;
  currentTime: number;
  onTempCommit: (text: string) => void;
  onTempDiscard: () => void;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPlay: () => void;
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
                                                       onTempCommit,
                                                       onTempDiscard,
                                                       onVideoUpload,
                                                       onPlay,
                                                       onShiftSubtitles,
                                                       onCaptureFrame,
                                                       onDownloadAudio,
                                                       onUpdateSubtitleText,
                                                       onDeleteSubtitle
                                                     }) => {
  return (
    <div className="flex flex-col w-full max-w-5xl gap-2 animate-in fade-in duration-200">
      <DefaultControls
        videoName={videoName}
        currentTime={currentTime}
        onVideoUpload={onVideoUpload}
        onShiftSubtitles={onShiftSubtitles}
        onPlay={onPlay}
        onCaptureFrame={onCaptureFrame}
      />
      {tempSubtitleLine && <TempSubtitleLineControls
        start={tempSubtitleLine.start}
        end={tempSubtitleLine.end}
        onCommit={onTempCommit}
        onDiscard={onTempDiscard}
        onDownloadAudio={onDownloadAudio}
      />}
      {activeSubtitleLine && <ActiveSubtitleLineControls
        subtitle={activeSubtitleLine}
        onDownloadAudio={onDownloadAudio}
        onTextChange={onUpdateSubtitleText}
        onDelete={onDeleteSubtitle}
      />}
    </div>
  );
};

export default AppControlBar;
