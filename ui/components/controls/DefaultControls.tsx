import React from 'react';
import {Video as VideoIcon, Camera, Play} from 'lucide-react';
import {formatTime} from '@/core/time.ts';

interface DefaultControlsProps {
  videoName: string;
  currentTime: number;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPlay: () => void;
  onCaptureFrame: () => void;
}

const DefaultControls: React.FC<DefaultControlsProps> = ({
                                                           videoName,
                                                           currentTime,
                                                           onVideoUpload,
                                                           onPlay,
                                                           onCaptureFrame
                                                         }) => {

  // Shared button styles
  const btnBase = "h-9 flex items-center justify-center gap-2 px-3 rounded-md border transition-all text-sm font-medium shadow-sm select-none";
  const btnSecondary = "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600";
  const kbdStyle = "hidden sm:inline-flex items-center ml-2 px-1.5 h-5 text-[10px] font-mono bg-black/20 border border-white/10 rounded text-current opacity-70 leading-none";

  return (
    <div className="flex items-center justify-between w-full relative h-[42px]">

      {/* Left: Video Selector */}
      <div className="flex items-center gap-2 z-10">
        <label className={`${btnBase} ${btnSecondary} cursor-pointer max-w-[240px]`}>
          <VideoIcon size={16} className="shrink-0"/>
          <span className="truncate">{videoName || "Select Video"}</span>
          <input type="file" accept="video/*" onChange={onVideoUpload} className="hidden"/>
        </label>
        <div className="h-5 w-px bg-slate-700/50 mx-1"></div>

        <button
          onClick={onPlay}
          className={`${btnBase} ${btnSecondary} ${videoName === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Play/Pause"
          disabled={videoName === ''}
        >
          <Play size={16}/>
          <kbd className={kbdStyle}>Space</kbd>
        </button>
      </div>

      {/* Center: Time Display */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none pointer-events-none">
        <div className="font-mono text-xl text-indigo-400 font-bold tracking-widest">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Right: Global Tools */}
      <div className="flex items-center gap-2 z-10">

        <button
          onClick={onCaptureFrame}
          className={`${btnBase} ${btnSecondary} px-2.5 ${videoName === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Capture Snapshot"
          disabled={videoName === ''}
        >
          <Camera size={16}/> Capture Frame
        </button>
      </div>

    </div>
  );
};

export default DefaultControls;
