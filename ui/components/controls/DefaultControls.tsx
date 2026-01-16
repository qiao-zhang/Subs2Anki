import React, {useState} from 'react';
import {Video as VideoIcon, MoveHorizontal, Camera, Play} from 'lucide-react';
import {formatTime} from '../../../core/time';

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

  const handleShiftAmountChanged = (shiftAmountString: string) => {
    const val = parseFloat(shiftAmountString);
    if (!isNaN(val) && val > 0) {
      setShiftAmount(val);
    } else {
      setShiftAmount(MIN_SHIFT_MS);
    }
  }

  const handleQuickShift = (ms: number) => {
    onShiftSubtitles(ms / 1000);
  };

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
          className={`${btnBase} ${btnSecondary}`}
          title="Play/Pause"
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
          className={`${btnBase} ${btnSecondary} px-2.5`}
          title="Capture Snapshot"
        >
          <Camera size={16}/> Capture Frame
        </button>

        <div className="h-5 w-px bg-slate-700/50 mx-1"></div>

        {/* Shift Controls */}
        <div className="relative">
          <button
            onClick={() => setIsShiftMenuOpen(!isShiftMenuOpen)}
            className={`${btnBase} ${isShiftMenuOpen ? 'bg-slate-700 text-white border-slate-600' : btnSecondary} px-2.5`}
            title="Global Time Shift"
          >
            <MoveHorizontal size={16}/> Global Shift
          </button>

          {isShiftMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsShiftMenuOpen(false)}></div>
              <div
                className="absolute bottom-full mb-2 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-3 min-w-[200px] animate-in fade-in zoom-in-95 duration-100">
                <h4 className="text-[10px] font-bold text-slate-500 mb-2 uppercase text-center tracking-wider">Global
                  Offset</h4>
                <div className="flex gap-2 items-center">
                  <button onClick={() => handleQuickShift(-shiftAmount)}
                          className="h-8 flex-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs text-slate-300 font-mono transition-colors">-{shiftAmount}ms
                  </button>
                  <div className="relative">
                    <input
                      type="number"
                      value={shiftAmount}
                      onChange={(e) => handleShiftAmountChanged(e.target.value)}
                      step={MIN_SHIFT_MS}
                      min={MIN_SHIFT_MS}
                      className="w-16 h-8 bg-slate-900 border border-slate-600 rounded px-1 text-sm text-white focus:border-indigo-500 outline-none text-center font-mono"
                    />
                  </div>
                  <button onClick={() => handleQuickShift(shiftAmount)}
                          className="h-8 flex-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs text-slate-300 font-mono transition-colors">+{shiftAmount}ms
                  </button>
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
