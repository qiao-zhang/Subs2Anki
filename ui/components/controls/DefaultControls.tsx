import React, { useState } from 'react';
import {Video as VideoIcon, MoveHorizontal, Camera, Play, Repeat} from 'lucide-react';
import { formatTime } from '../../../core/time';

interface DefaultControlsProps {
  videoName: string;
  currentTime: number;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onShiftSubtitles: (offset: number) => void;
  onPlay: () => void;
  onCaptureFrame: () => void;
}

const DefaultControls: React.FC<DefaultControlsProps> = ({
                                                           videoName,
                                                           currentTime,
                                                           onVideoUpload,
                                                           onShiftSubtitles,
  onPlay,
                                                           onCaptureFrame
                                                         }) => {
  const MIN_SHIFT_MS = 10;
  const [isShiftMenuOpen, setIsShiftMenuOpen] = useState(false);
  const [shiftAmount, setShiftAmount] = useState(MIN_SHIFT_MS);

  const handleShiftAmountChanged = (shiftAmountString: string) =>
  {
    const val = parseFloat(shiftAmountString);
    if (!isNaN(val) && val > 0) {
      setShiftAmount(val);
    }
    else {
      setShiftAmount(MIN_SHIFT_MS);
    }
  }

  const handleQuickShift = (ms: number) => {
    onShiftSubtitles(ms / 1000);
  };

  return (
    <div className="flex items-center justify-between w-full relative h-[42px]">

      {/* Left: Video Selector */}
      <div className="flex items-center gap-2 z-10">
        <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition text-sm font-medium text-slate-300 border border-slate-700">
          <VideoIcon size={16}/>
          <span className="truncate max-w-[200px]">{videoName || "Select Video File"}</span>
          <input type="file" accept="video/*" onChange={onVideoUpload} className="hidden"/>
        </label>
      </div>

      {/* Center: Time Display */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none pointer-events-none">
        <div className="font-mono text-xl text-indigo-400 font-bold tracking-widest">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Right: Global Tools */}
      <div className="flex items-center gap-2 z-10">

        {/* Capture Frame Button */}
        <button
          onClick={onCaptureFrame}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700"
          title="Capture Snapshot"
        >
          <Camera size={18} /> Capture Image
        </button>

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        <button
          onClick={onPlay}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition border border-slate-700 font-medium text-sm"
          title="Play/Pause (Hotkey: P)"
        >
          <Play size={16}/> Play
        </button>

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        {/* Shift Controls */}
        <div className="relative">
          <button
            onClick={() => setIsShiftMenuOpen(!isShiftMenuOpen)}
            className={`p-2 rounded-lg transition border ${isShiftMenuOpen ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            title="Global Time Shift"
          >
            <MoveHorizontal size={18} /> Global Shift
          </button>
          {isShiftMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsShiftMenuOpen(false)}></div>
              <div className="absolute bottom-full mb-2 right-0 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 p-3 min-w-[200px]">
                <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase text-center">Global Time Shift</h4>
                <div className="flex gap-2 items-center">
                  <button onClick={() => handleQuickShift(-shiftAmount)} className="flex-1 px-1 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 font-mono">-{shiftAmount}ms</button>
                  <input
                    type="number"
                    value={shiftAmount}
                    onChange={(e) => handleShiftAmountChanged(e.target.value)}
                    step={MIN_SHIFT_MS}
                    min={MIN_SHIFT_MS}
                    className="w-16 bg-slate-900 border border-slate-600 rounded px-1 py-1 text-sm text-white focus:border-indigo-500 outline-none text-center"
                  />
                  <button onClick={() => handleQuickShift(shiftAmount)} className="flex-1 px-1 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 font-mono">+{shiftAmount}ms</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default DefaultControls;
