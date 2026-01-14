
import React from 'react';
import { Video as VideoIcon, Bot, Play, PauseOctagon, Repeat } from 'lucide-react';
import { formatTime } from '../../../core/time';
import { LLMSettings } from '../../../core/gemini';
import { useAppStore } from '../../../core/store';

interface ActiveSubtitleLineControlsProps {
  videoName: string;
  currentTime: number;
  llmSettings: LLMSettings;
  onVideoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenLLMSettings: () => void;
  onReplay: () => void;
}

const ActiveSubtitleLineControls: React.FC<ActiveSubtitleLineControlsProps> = ({
                                                                                 videoName,
                                                                                 currentTime,
                                                                                 llmSettings,
                                                                                 onVideoUpload,
                                                                                 onOpenLLMSettings,
                                                                                 onReplay
                                                                               }) => {
  const { playbackMode, setPlaybackMode } = useAppStore();

  return (
    <div className="flex items-center gap-4 w-full justify-center">
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

      {/* Playback Controls */}
      <div className="flex gap-2 items-center">
        <button
          onClick={onReplay}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition border border-slate-700 font-medium text-sm animate-in fade-in zoom-in duration-200"
          title="Replay Current Line (Hotkey: R)"
        >
          <Play size={16} /> Play
        </button>

        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setPlaybackMode(playbackMode === 'auto-pause' ? 'continuous' : 'auto-pause')}
            className={`p-1.5 rounded transition ${playbackMode === 'auto-pause' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            title="Auto-Pause at end of subtitle (Hotkey: P)"
          >
            <PauseOctagon size={18} />
          </button>
          <button
            onClick={() => setPlaybackMode(playbackMode === 'loop' ? 'continuous' : 'loop')}
            className={`p-1.5 rounded transition ${playbackMode === 'loop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            title="Loop current subtitle (Hotkey: L)"
          >
            <Repeat size={18} />
          </button>
        </div>
      </div>

      <div className="h-8 w-px bg-slate-800"></div>

      {/* AI Settings */}
      <button
        onClick={onOpenLLMSettings}
        className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition border ${llmSettings.apiKey ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-red-900/20 border-red-800/50 text-red-400'}`}
      >
        <Bot size={16} />
        <span>{llmSettings.model.split('-')[1]?.toUpperCase() || "AI"}</span>
      </button>
    </div>
  );
};

export default ActiveSubtitleLineControls;
