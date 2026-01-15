import React, { useState } from 'react';
import {Check, Download} from 'lucide-react';
import { formatTime } from '../../../core/time';

interface TempSubtitleLineControlsProps {
  start: number;
  end: number;
  onCommit: (text: string) => void;
  onDiscard: () => void;
  onDownloadAudio: () => void;
}

const TempSubtitleLineControls: React.FC<TempSubtitleLineControlsProps> = ({
                                                                             start,
                                                                             end,
                                                                             onCommit,
                                                                             onDiscard,
                                                                             onDownloadAudio
                                                                           }) => {
  const [text, setText] = useState('');

  return (
    <div className="flex flex-col w-full max-w-5xl gap-2 animate-in fade-in duration-200">

      {/* Row 2: Editor */}
      <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-lg border border-slate-800">

        {/* Timestamp Info */}
        <div className="flex flex-col px-2 py-1 bg-slate-900 rounded border border-slate-700 min-w-[140px] text-center shrink-0">
          <div className="font-mono text-xs text-indigo-400">
            {formatTime(start)} - {formatTime(end)}
          </div>
          <div className="text-[10px] text-slate-500">
            {(end - start).toFixed(2)}s
          </div>
        </div>

        {/* Input */}
        <div className="flex-1 flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
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

        <button
          disabled={text === ''}
          onClick={onDownloadAudio}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700"
          title="Download Audio Clip"
        >
          <Download size={18} /> Capture Audio
        </button>
      </div>
    </div>
  );
};

export default TempSubtitleLineControls;
