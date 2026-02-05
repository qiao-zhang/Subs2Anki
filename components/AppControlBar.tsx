import React from 'react';
import TempSubtitleLineControls from '@/components/controls/TempSubtitleLineControls';
import ActiveSubtitleLineControls from '@/components/controls/ActiveSubtitleLineControls';
import DefaultControls from '@/components/controls/DefaultControls';

interface AppControlBarProps {
  tempSubtitleLine: { start: number, end: number } | null;
  activeSubtitleLineId: number | null;
  videoName: string;
  currentTime: number;
  onTempCommit: (text: string) => void;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCaptureFrame: () => void;
  onDownloadAudio: () => void;
  onUpdateSubtitleText: (id: number, text: string) => void;
}

const AppControlBar: React.FC<AppControlBarProps> = ({
                                                       tempSubtitleLine,
                                                       activeSubtitleLineId,
                                                       videoName,
                                                       currentTime,
                                                       onTempCommit,
                                                       onVideoUpload,
                                                       onCaptureFrame,
                                                       onDownloadAudio,
                                                       onUpdateSubtitleText,
                                                     }) => {
  return (
    <div className="flex flex-col w-full max-w-5xl gap-2 animate-in fade-in duration-200">
      <DefaultControls
        videoName={videoName}
        currentTime={currentTime}
        onVideoUpload={onVideoUpload}
        onCaptureFrame={onCaptureFrame}
      />
      {tempSubtitleLine && <TempSubtitleLineControls
        start={tempSubtitleLine.start}
        end={tempSubtitleLine.end}
        onCommit={onTempCommit}
        onDownloadAudio={onDownloadAudio}
      />}
      {activeSubtitleLineId && <ActiveSubtitleLineControls
        subtitleLineId={activeSubtitleLineId}
        onDownloadAudio={onDownloadAudio}
        onTextChange={onUpdateSubtitleText}
      />}
    </div>
  );
};

export default AppControlBar;
