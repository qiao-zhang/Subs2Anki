import React, {useState} from 'react';
import {Check, Clock, Download} from 'lucide-react';
import {formatTimestamp, formatTimeDifference} from '@/services/time.ts';
import {BTN_BASE, BTN_PRIMARY, BTN_SECONDARY, KBD_STYLE, TIMESTAMP_WRAPPER, TIMESTAMP_TEXT} from '@/services/shared-styles.ts';

interface TempSubtitleLineControlsProps {
  start: number;
  end: number;
  onDownloadAudio: () => void;
  onCommit: (text: string) => void;
}

const TempSubtitleLineControls: React.FC<TempSubtitleLineControlsProps> = ({
                                                                             start,
                                                                             end,
                                                                             onDownloadAudio,
                                                                             onCommit,
                                                                           }) => {
  const [text, setText] = useState('');

  return (
    <div className="flex flex-col w-full max-w-5xl gap-2 animate-in fade-in duration-200">

      <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-lg border border-slate-800">

        {/* Timestamp Info */}
        <div className={TIMESTAMP_WRAPPER}>
          <div className="flex items-center justify-center gap-2">
            <Clock size={12} className="text-slate-600"/>
            <span className={TIMESTAMP_TEXT}>
              {formatTimestamp(start)} - {formatTimestamp(end)}
            </span>
            <span className="text-[10px] text-slate-600 ml-1 border-l border-slate-700 pl-2">
              {formatTimeDifference(start, end)}
            </span>
          </div>
        </div>

        {/* Input */}
        <div className="flex-1 flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-transparent border-none text-lg text-white placeholder-slate-600 focus:ring-0 focus:outline-none px-2 h-9"
            placeholder="Type subtitle text..."
            autoFocus
          />
          <button
            onClick={() => onCommit(text)}
            className={`${BTN_BASE} h-9 ${BTN_PRIMARY}`}
          >
            <Check size={16}/>
            Add
            <kbd className={KBD_STYLE}>Enter</kbd>
          </button>
          <button
            onClick={onDownloadAudio}
            className={`${BTN_BASE} h-9 ${BTN_SECONDARY}`}
            title="Download Audio Clip"
          >
            <Download size={18}/> Clip Audio
          </button>
        </div>

      </div>
    </div>
  );
};

export default TempSubtitleLineControls;
