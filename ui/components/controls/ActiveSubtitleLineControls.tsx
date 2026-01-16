import React, {useEffect, useState} from 'react';
import {Download, Trash2, Clock} from 'lucide-react';
import {formatTime} from '../../../core/time';
import {SubtitleLine} from '../../../core/types';

interface ActiveSubtitleLineControlsProps {
  subtitle: SubtitleLine;
  onDownloadAudio: () => void;
  onTextChange: (id: number, text: string) => void;
  onDelete: (id: number) => void;
}

const ActiveSubtitleLineControls: React.FC<ActiveSubtitleLineControlsProps> = ({
                                                                                 subtitle,
                                                                                 onDownloadAudio,
                                                                                 onTextChange,
                                                                                 onDelete
                                                                               }) => {
  const [localText, setLocalText] = useState(subtitle.text);

  // Sync local text when subtitle prop changes (switching active line)
  useEffect(() => {
    setLocalText(subtitle.text);
  }, [subtitle.id, subtitle.text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalText(e.target.value);
    onTextChange(subtitle.id, e.target.value);
  };

  // Shared button styles
  const btnBase = "h-9 flex items-center justify-center gap-2 px-3 rounded-md border transition-all text-sm font-medium shadow-sm select-none";
  const btnSecondary = "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600";
  const btnDanger = "bg-slate-800 border-slate-700 text-slate-400 hover:bg-red-900/20 hover:text-red-400 hover:border-red-800/50";

  return (
    <div className="flex flex-col w-full max-w-5xl gap-2 animate-in fade-in duration-200">

      <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-lg border border-slate-800">
        {/* Timestamp Info */}
        <div
          className="flex flex-col px-3 py-1 bg-slate-900 rounded border border-slate-700 min-w-[140px] text-center shrink-0 h-9 justify-center">
          <div className="flex items-center justify-center gap-2">
            <Clock size={12} className="text-slate-600"/>
            <span className="font-mono text-xs text-emerald-400">
              {formatTime(subtitle.startTime)} - {formatTime(subtitle.endTime)}
            </span>
            <span className="text-[10px] text-slate-600 ml-1 border-l border-slate-700 pl-2">
              {(subtitle.endTime - subtitle.startTime).toFixed(2)}s
            </span>
          </div>
        </div>

        {/* Text Input */}
        <input
          type="text"
          value={localText}
          onChange={handleTextChange}
          placeholder="Subtitle Text..."
          className="flex-1 bg-transparent border-none text-lg text-white placeholder-slate-600 focus:ring-0 focus:outline-none px-2 font-medium h-9"
          autoFocus
        />
        <button
          onClick={onDownloadAudio}
          className={`${btnBase} ${btnSecondary}`}
          title="Download Audio Clip"
        >
          <Download size={18}/> Capture Audio Clip
        </button>
        <button
          onClick={() => onDelete(subtitle.id)}
          className={`${btnBase} ${btnDanger}`}
          title="Delete Subtitle"
        >
          <Trash2 size={16}/> Delete
        </button>
      </div>
    </div>
  );
};

export default ActiveSubtitleLineControls;
