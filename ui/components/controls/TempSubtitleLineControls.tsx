
import React, { useState } from 'react';
import { Play, Check, X, Download, Clock } from 'lucide-react';
import { formatTime } from '../../../core/time';

interface TempSubtitleLineControlsProps {
  start: number;
  end: number;
  onPlay: () => void;
  onCommit: (text: string) => void;
  onDiscard: () => void;
  onDownloadAudio: () => void;
}

const TempSubtitleLineControls: React.FC<TempSubtitleLineControlsProps> = ({
                                                                             start,
                                                                             end,
                                                                             onPlay,
                                                                             onCommit,
                                                                             onDiscard,
                                                                             onDownloadAudio
                                                                           }) => {
  const [text, setText] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onCommit(text);
    } else if (e.key === 'Escape') {
      onDiscard();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-5xl gap-2 animate-in fade-in duration-200">

      {/* Row 1: Actions */}
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onPlay}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700 font-medium text-sm"
            title="Play Selection"
          >
            <Play size={16} /> Play
          </button>

          <button
            onClick={onDownloadAudio}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700"
            title="Download Audio Clip"
          >
            <Download size={18} />
          </button>
        </div>

        <div className="text-xs text-amber-400 font-bold uppercase tracking-widest bg-amber-950/30 px-3 py-1 rounded border border-amber-900/50">
          New Selection
        </div>

        <button
          onClick={onDiscard}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition"
          title="Discard Selection (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      {/* Row 2: Editor */}
      <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-lg border border-slate-800">

        {/* Timestamp Info */}
        <div className="flex flex-col px-2 py-1 bg-slate-900 rounded border border-slate-700 min-w-[140px] text-center shrink-0">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">
            <Clock size={10} /> Duration
          </div>
          <div className="font-mono text-xs text-indigo-400">
            {formatTime(start)} - {formatTime(end)}
          </div>
          <div className="text-[10px] text-slate-500">
            {(end - start).toFixed(2)}s
          </div>
        </div>

        {/* Input */}
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none text-lg text-white placeholder-slate-600 focus:ring-0 focus:outline-none px-2"
            placeholder="Type subtitle text... (Press Enter to Add)"
            autoFocus
          />
          <button
            onClick={() => onCommit(text)}
            className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm transition shadow-lg shadow-emerald-600/20 flex items-center gap-1"
          >
            <Check size={16} /> Add
          </button>
        </div>

      </div>
    </div>
  );
};

export default TempSubtitleLineControls;
