import React, {useState} from 'react';
import {Check, Clock, Download} from 'lucide-react';
import {formatTime} from '../../../core/time';

interface TempSubtitleLineControlsProps {
  start: number;
  end: number;
  onDownloadAudio: () => void;
  onCommit: (text: string) => void;
}

const TempSubtitleLineControls: React.FC<TempSubtitleLineControlsProps> = ({
                                                                             start,
                                                                             end,
                                                                             onDownloadAudio,
                                                                             onCommit,
                                                                           }) => {
  const [text, setText] = useState('');

  // Shared button styles
  const btnBase = "h-9 flex items-center justify-center gap-2 px-3 rounded-md border transition-all text-sm font-medium shadow-sm select-none";
  const btnPrimary = "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow-md shadow-emerald-900/20";
  const btnSecondary = "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600";
  const kbdStyle = "hidden sm:inline-flex items-center ml-2 px-1.5 h-5 text-[10px] font-mono bg-black/20 border border-white/10 rounded text-current opacity-70 leading-none";

  return (
    <div className="flex flex-col w-full max-w-5xl gap-2 animate-in fade-in duration-200">

      <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-lg border border-slate-800">

        {/* Timestamp Info */}
        <div
          className="flex flex-col px-3 py-1 bg-slate-900 rounded border border-slate-700 min-w-[140px] text-center shrink-0 h-9 justify-center">
          <div className="flex items-center justify-center gap-2">
            <Clock size={12} className="text-slate-600"/>
            <span className="font-mono text-xs text-indigo-400">
              {formatTime(start)} - {formatTime(end)}
            </span>
            <span className="text-[10px] text-slate-600 ml-1 border-l border-slate-700 pl-2">
              {(end - start).toFixed(2)}s
            </span>
          </div>
        </div>

        {/* Input */}
        <div className="flex-1 flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-transparent border-none text-lg text-white placeholder-slate-600 focus:ring-0 focus:outline-none px-2 h-9"
            placeholder="Type subtitle text..."
            autoFocus
          />
          <button
            onClick={() => onCommit(text)}
            className={`${btnBase} ${btnPrimary}`}
          >
            <Check size={16}/>
            Add
            <kbd className={kbdStyle}>Enter</kbd>
          </button>
          <button
            onClick={onDownloadAudio}
            className={`${btnBase} ${btnSecondary}`}
            title="Download Audio Clip"
          >
            <Download size={18}/> Clip Audio
          </button>
        </div>

      </div>
    </div>
  );
};

export default TempSubtitleLineControls;
