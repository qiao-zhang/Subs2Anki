import React, {useEffect, useState} from 'react';
import {Download, Clock} from 'lucide-react';
import AutoResizeEditableTextArea from "@/components/AutoResizeEditableTextArea.tsx";
import {useAppStore} from "@/services/store.ts";
import {formatTimestamp} from '@/services/time.ts';
import {SubtitleLine} from '@/services/types.ts';
import {formatTimeDifference} from '@/services/time.ts';
import {BTN_BASE, BTN_SECONDARY, TIMESTAMP_WRAPPER, TIMESTAMP_TEXT} from '@/services/shared-styles.ts';

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
  const getSubtitleLine = useAppStore(state => state.getSubtitleLine);

  const [subtitleLine, setSubtitleLine] = useState<SubtitleLine | null>(null);
  const [localText, setLocalText] = useState<string | null>(null);

  useEffect(() => {
    const line = getSubtitleLine(subtitleLineId);
    setSubtitleLine(line || null);
    setLocalText(line?.text || null);
  }, [subtitleLineId]);

  const handleTextSave = (text: string) => {
    setLocalText(text);
    onTextChange(subtitleLineId, text);
  };

  if (subtitleLine === null) {
    return null;
  }

  return (
    <div className="flex flex-col w-full max-w-5xl gap-2 animate-in fade-in duration-200">

      <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-lg border border-slate-800">
        {/* Timestamp Info */}
        <div className={TIMESTAMP_WRAPPER}>
          <div className="flex items-center justify-center gap-2">
            <Clock size={12} className="text-slate-600"/>
            <span className={TIMESTAMP_TEXT}>
              {formatTimestamp(subtitleLine.startTime)} - {formatTimestamp(subtitleLine.endTime)}
            </span>
            <span className="text-[10px] text-slate-600 ml-1 border-l border-slate-700 pl-2">
              {formatTimeDifference(subtitleLine.startTime, subtitleLine.endTime)}
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
          className={`${BTN_BASE} h-9 ${BTN_SECONDARY}`}
          title="Download Audio Clip"
        >
          <Download size={18}/> Clip Audio
        </button>
      </div>
    </div>
  );
};

export default ActiveSubtitleLineControls;
