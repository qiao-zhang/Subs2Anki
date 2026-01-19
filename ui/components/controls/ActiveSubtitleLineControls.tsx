import React, {useEffect, useState} from 'react';
import {Download, Clock} from 'lucide-react';
import AutoResizeEditableTextArea from "@/ui/components/AutoResizeEditableTextArea.tsx";
import {useAppStore} from "@/core/store.ts";
import {formatTime} from '../../../core/time';
import {SubtitleLine} from '../../../core/types';

interface ActiveSubtitleLineControlsProps {
  subtitleLineId: number,
  onDownloadAudio: () => void;
  onTextChange: (id: number, text: string) => void;
}

const ActiveSubtitleLineControls: React.FC<ActiveSubtitleLineControlsProps> = ({
                                                                                 subtitleLineId,
                                                                                 onDownloadAudio,
                                                                                 onTextChange,
                                                                               }) => {
  const {
    subtitleLines
  } = useAppStore();

  const [subtitleLine, setSubtitleLine] = useState<SubtitleLine | null>(null);
  const [localText, setLocalText] = useState<string | null>(null);

  useEffect(() => {
    const line = subtitleLines.find(s => s.id === subtitleLineId);
    setSubtitleLine(line || null);
    setLocalText(line?.text || null);
  }, [subtitleLineId]);

  const handleTextSave = (text: string) => {
    setLocalText(text);
    onTextChange(subtitleLineId, text);
  };

  // Shared button styles
  const btnBase = "h-9 flex items-center justify-center gap-2 px-3 rounded-md border transition-all text-sm font-medium shadow-sm select-none";
  const btnSecondary = "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600";

  if (subtitleLine === null) {
    return null;
  }

  return (
    <div className="flex flex-col w-full max-w-5xl gap-2 animate-in fade-in duration-200">

      <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-lg border border-slate-800">
        {/* Timestamp Info */}
        <div
          className="flex flex-col px-3 py-1 bg-slate-900 rounded border border-slate-700 min-w-[140px] text-center shrink-0 h-9 justify-center">
          <div className="flex items-center justify-center gap-2">
            <Clock size={12} className="text-slate-600"/>
            <span className="font-mono text-xs text-emerald-400">
              {formatTime(subtitleLine.startTime)} - {formatTime(subtitleLine.endTime)}
            </span>
            <span className="text-[10px] text-slate-600 ml-1 border-l border-slate-700 pl-2">
              {(subtitleLine.endTime - subtitleLine.startTime).toFixed(2)}s
            </span>
            {/*DEV*/}
            <span className="text-[10px] text-slate-600 ml-1 border-l border-slate-700 pl-2">
              {subtitleLineId}
            </span>
            {/*DEV*/}
          </div>
        </div>

        {/* Text Input */}
        <AutoResizeEditableTextArea
          initialValue={localText}
          onSave={handleTextSave}
          placeholder="Subtitle Line Text..."
          className="flex-1 bg-transparent border-none text-lg placeholder-slate-600 focus:ring-0 focus:outline-none px-2 font-medium h-9"
        />
        <button
          onClick={onDownloadAudio}
          className={`${btnBase} ${btnSecondary}`}
          title="Download Audio Clip"
        >
          <Download size={18}/> Clip Audio
        </button>
      </div>
    </div>
  );
};

export default ActiveSubtitleLineControls;
