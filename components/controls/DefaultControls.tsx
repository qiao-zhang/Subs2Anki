import React from 'react';
import {Video as VideoIcon, Camera, Play, RotateCcw, Redo} from 'lucide-react';
import {formatTimestamp} from '@/services/time.ts';
import {BTN_BASE, BTN_SECONDARY, KBD_STYLE} from '@/services/shared-styles.ts';

interface DefaultControlsProps {
  videoName: string;
  currentTime: number;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPlay: () => void;
  onCaptureFrame: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const DefaultControls: React.FC<DefaultControlsProps> = ({
                                                           videoName,
                                                           currentTime,
                                                           onVideoUpload,
                                                           onPlay,
                                                           onCaptureFrame,
                                                           onUndo,
                                                           onRedo,
                                                           canUndo = false,
                                                           canRedo = false
                                                         }) => {

  return (
    <div className="flex items-center justify-between w-full relative h-[42px]">

      {/* Left: Video Selector */}
      <div className="flex items-center gap-2 z-10">
        <label className={`${BTN_BASE} h-9 ${BTN_SECONDARY} cursor-pointer max-w-[240px]`}>
          <VideoIcon size={16} className="shrink-0"/>
          <span className="truncate">{videoName || "Select Video"}</span>
          <input type="file" accept="video/*" onChange={onVideoUpload} className="hidden"/>
        </label>
        <div className="h-5 w-px bg-slate-700/50 mx-1"></div>

        <button
          onClick={onPlay}
          className={`${BTN_BASE} h-9 ${BTN_SECONDARY} ${videoName === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Play/Pause"
          disabled={videoName === ''}
        >
          <Play size={16}/>
          <kbd className={KBD_STYLE}>Space</kbd>
        </button>

        {/* Undo/Redo Buttons */}
        <div className="flex gap-1">
          <button
            onClick={onUndo}
            className={`${BTN_BASE} h-9 ${BTN_SECONDARY} px-2.5 ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
          >
            <RotateCcw size={16}/>
            <kbd className={KBD_STYLE}>Ctrl+Z</kbd>
          </button>

          <button
            onClick={onRedo}
            className={`${BTN_BASE} h-9 ${BTN_SECONDARY} px-2.5 ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
            disabled={!canRedo}
          >
            <Redo size={16}/>
            <kbd className={KBD_STYLE}>Ctrl+Y</kbd>
          </button>
        </div>
      </div>

      {/* Center: Time Display */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none pointer-events-none">
        <div className="font-mono text-xl text-indigo-400 font-bold tracking-widest">
          {formatTimestamp(currentTime, 'trim')}
        </div>
      </div>

      {/* Right: Global Tools */}
      <div className="flex items-center gap-2 z-10">

        <button
          onClick={onCaptureFrame}
          className={`${BTN_BASE} h-9 ${BTN_SECONDARY} px-2.5 ${videoName === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
