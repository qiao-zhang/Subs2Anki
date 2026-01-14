import React, { useState } from 'react';
import { Video as VideoIcon, MoveHorizontal, Repeat, Camera } from 'lucide-react';
import { formatTime } from '../../../core/time';
import { useAppStore } from '../../../core/store';

interface DefaultControlsProps {
  videoName: string;
  currentTime: number;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onShiftSubtitles: (offset: number) => void;
  onCaptureFrame: () => void;
}

const DefaultControls: React.FC<DefaultControlsProps> = ({
                                                           videoName,
                                                           currentTime,
                                                           onVideoUpload,
                                                           onShiftSubtitles,
                                                           onCaptureFrame
                                                         }) => {
  const { playbackMode, setPlaybackMode } = useAppStore();
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
    <div className="flex items-center gap-4 w-full justify-center relative">
      {/* Video Selector */}
      <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition text-sm font-medium text-slate-300 border border-slate-700">
        <VideoIcon size={16}/>
        <span className="truncate max-w-[200px]">{videoName || "Select Video File"}</span>
        <input type="file" accept="video/*" onChange={onVideoUpload} className="hidden"/>
      </label>

      <div className="h-8 w-px bg-slate-800"></div>

      {/* Time Display */}
      <div className="font-mono text-xl text-indigo-400 font-bold tracking-widest min-w-[100px] text-center">
        {formatTime(currentTime)}
      </div>

      <div className="h-8 w-px bg-slate-800"></div>

      {/* Capture Frame Button */}
      <button
        onClick={onCaptureFrame}
        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700"
        title="Capture Snapshot"
      >
        <Camera size={18} />
      </button>

      <div className="h-8 w-px bg-slate-800"></div>

      {/* Playback Mode Controls */}
      <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
        <button
          onClick={() => setPlaybackMode(playbackMode === 'loop' ? 'auto-pause' : 'loop')}
          className={`p-1.5 rounded transition ${playbackMode === 'loop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
          title="Loop current subtitle (Hotkey: L)"
        >
          <Repeat size={18} />
        </button>
      </div>

      <div className="h-8 w-px bg-slate-800"></div>

      {/* Shift Controls */}
      <div className="relative">
        <button
          onClick={() => setIsShiftMenuOpen(!isShiftMenuOpen)}
          className={`p-2 rounded transition border ${isShiftMenuOpen ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
          title="Global Time Shift"
        >
          <MoveHorizontal size={16} />
        </button>
        {isShiftMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsShiftMenuOpen(false)}></div>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 p-3">
              <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Global Time Shift</h4>
              <div className="flex gap-2 items-center">
                <button onClick={() => handleQuickShift(-shiftAmount)} className="flex-1 px-1 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300">-{shiftAmount}ms</button>
                <input
                  type="number"
                  value={shiftAmount}
                  onChange={(e) => handleShiftAmountChanged(e.target.value)}
                  step={MIN_SHIFT_MS}
                  min={MIN_SHIFT_MS}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded px-1 py-1 text-sm text-white focus:border-indigo-500 outline-none"
                />
                <button onClick={() => handleQuickShift(shiftAmount)} className="flex-1 px-1 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300">+{shiftAmount}ms</button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="h-8 w-px bg-slate-800"></div>

    </div>
  );
};

export default DefaultControls;
