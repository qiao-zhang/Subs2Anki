
import React, { useEffect, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { formatTime } from '../../../core/time';
import { SubtitleLine } from '../../../core/types';

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

  return (
    <div className="flex flex-col w-full max-w-5xl gap-2 animate-in fade-in duration-200">

      {/* Row 2: Editor */}
      <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-lg border border-slate-800">
        {/* Timestamp Info */}
        <div className="flex flex-col px-2 py-1 bg-slate-900 rounded border border-slate-700 min-w-[140px] text-center shrink-0">
          <div className="font-mono text-xs text-emerald-400">
            {formatTime(subtitle.startTime)} - {formatTime(subtitle.endTime)}
          </div>
          <div className="text-[10px] text-slate-500">
            {(subtitle.endTime - subtitle.startTime).toFixed(2)}s
          </div>
        </div>

        {/* Text Input */}
        <input
          type="text"
          value={localText}
          onChange={handleTextChange}
          placeholder="Subtitle Text..."
          className="flex-1 bg-transparent border-none text-lg text-white placeholder-slate-600 focus:ring-0 focus:outline-none px-2 font-medium"
          autoFocus
        />
        <button
          onClick={onDownloadAudio}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700"
          title="Download Audio Clip"
        >
          <Download size={18} /> Capture Audio
        </button>
        <button
          onClick={() => onDelete(subtitle.id)}
          className="p-2 bg-slate-800 border border-slate-700 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
          title="Delete Subtitle"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default ActiveSubtitleLineControls;
