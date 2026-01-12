
import React from 'react';
import TempSubtitleLineControls from './controls/TempSubtitleLineControls';
import ActiveSubtitleLineControls from './controls/ActiveSubtitleLineControls';
import DefaultControls from './controls/DefaultControls';
import { LLMSettings } from '../../core/gemini';

interface AppControlBarProps {
  tempSubtitleLine: {start: number, end: number} | null;
  activeSubtitleId: number | null;
  videoName: string;
  currentTime: number;
  llmSettings: LLMSettings;
  onTempPlay: () => void;
  onTempCommit: () => void;
  onTempDiscard: () => void;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenLLMSettings: () => void;
  onReplayActive: () => void;
}

const AppControlBar: React.FC<AppControlBarProps> = ({
                                                       tempSubtitleLine,
                                                       activeSubtitleId,
                                                       videoName,
                                                       currentTime,
                                                       llmSettings,
                                                       onTempPlay,
                                                       onTempCommit,
                                                       onTempDiscard,
                                                       onVideoUpload,
                                                       onOpenLLMSettings,
                                                       onReplayActive
                                                     }) => {
  if (tempSubtitleLine) {
    return (
      <TempSubtitleLineControls
        start={tempSubtitleLine.start}
        end={tempSubtitleLine.end}
        onPlay={onTempPlay}
        onCommit={onTempCommit}
        onDiscard={onTempDiscard}
      />
    );
  }

  if (activeSubtitleId !== null) {
    return (
      <ActiveSubtitleLineControls
        videoName={videoName}
        currentTime={currentTime}
        llmSettings={llmSettings}
        onVideoUpload={onVideoUpload}
        onOpenLLMSettings={onOpenLLMSettings}
        onReplay={onReplayActive}
      />
    );
  }

  return (
    <DefaultControls
      videoName={videoName}
      currentTime={currentTime}
      llmSettings={llmSettings}
      onVideoUpload={onVideoUpload}
      onOpenLLMSettings={onOpenLLMSettings}
    />
  );
};

export default AppControlBar;
