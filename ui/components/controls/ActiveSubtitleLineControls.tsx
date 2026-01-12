import React from 'react';
import { Video as VideoIcon, Bot, Play } from 'lucide-react';
import { formatTime } from '../../../core/time';
import { LLMSettings } from '../../../core/gemini';

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

      {/* Replay Button */}
      <button 
        onClick={onReplay} 
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition border border-slate-700 font-medium text-sm animate-in fade-in zoom-in duration-200"
      >
        <Play size={16} /> Play
      </button>

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
