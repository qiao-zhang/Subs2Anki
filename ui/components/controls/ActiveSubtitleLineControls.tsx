
import React, { useEffect, useState } from 'react';
import { Video as VideoIcon, Play, Repeat, Download, Trash2, Clock } from 'lucide-react';
import { formatTime } from '../../../core/time';
import { useAppStore } from '../../../core/store';
import { SubtitleLine } from '../../../core/types';

interface ActiveSubtitleLineControlsProps {
  videoName: string;
  currentTime: number;
  subtitle: SubtitleLine;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPlay: () => void;
  onDownloadAudio: () => void;
  onTextChange: (id: number, text: string) => void;
  onDelete: (id: number) => void;
}

const ActiveSubtitleLineControls: React.FC<ActiveSubtitleLineControlsProps> = ({
                                                                                 videoName,
                                                                                 currentTime,
                                                                                 subtitle,
                                                                                 onVideoUpload,
                                                                                 onPlay,
                                                                                 onDownloadAudio,
                                                                                 onTextChange,
                                                                                 onDelete
                                                                               }) => {
  const {playbackMode, setPlaybackMode} = useAppStore();
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

      {/* Row 1: Controls & Status */}
      <div className="flex items-center gap-4 justify-between">

        {/* Left: Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPlay}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition border border-slate-700 font-medium text-sm"
            title="Replay Current Line (Hotkey: R)"
          >
            <Play size={16}/> Play
          </button>

          <button
            onClick={() => setPlaybackMode(playbackMode === 'loop' ? 'auto-pause' : 'loop')}
            className={`p-1.5 rounded transition border ${playbackMode === 'loop' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
            title="Loop current subtitle (Hotkey: L)"
          >
            <Repeat size={18}/>
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1"></div>

          <button
            onClick={onDownloadAudio}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700"
            title="Download Audio Clip"
          >
            <Download size={18} />
          </button>
        </div>

        {/* Center: File & Current Time */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 max-w-[200px] opacity-70">
            <VideoIcon size={12}/>
            <span className="truncate">{videoName}</span>
          </div>
          <span className="font-mono text-slate-400">{formatTime(currentTime)}</span>
        </div>

        {/* Right: Actions */}
        <div>
          <button
            onClick={() => onDelete(subtitle.id)}
            className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition"
            title="Delete Subtitle"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Row 2: Editor */}
      <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-lg border border-slate-800">
        {/* Timestamp Info */}
        <div className="flex flex-col px-2 py-1 bg-slate-900 rounded border border-slate-700 min-w-[140px] text-center shrink-0">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">
            <Clock size={10} /> Time
          </div>
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
      </div>

    </div>
  );
};

export default ActiveSubtitleLineControls;
