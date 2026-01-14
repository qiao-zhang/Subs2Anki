
import React from 'react';
import { Play, Check, X, Download } from 'lucide-react';
import { formatTime } from '../../../core/time';

interface TempSubtitleLineControlsProps {
  start: number;
  end: number;
  onPlay: () => void;
  onCommit: () => void;
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
  return (
    <div className="flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300 w-full justify-center">
      <div className="text-sm font-mono text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded border border-emerald-900/50">
        {formatTime(start)} - {formatTime(end)}
      </div>

      <div className="h-6 w-px bg-slate-700 mx-1"></div>

      <button
        onClick={onPlay}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700 font-medium"
        title="Play Selection"
      >
        <Play size={16} />
      </button>

      <button
        onClick={onDownloadAudio}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700 font-medium"
        title="Download Audio Clip"
      >
        <Download size={16} />
      </button>

      <button
        onClick={onCommit}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-lg shadow-emerald-500/20 font-bold"
        title="Add to Subtitles"
      >
        <Check size={16} /> Add Subtitle
      </button>

      <div className="h-6 w-px bg-slate-700 mx-1"></div>

      <button
        onClick={onDiscard}
        className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-red-400 transition"
        title="Discard Selection"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default TempSubtitleLineControls;
