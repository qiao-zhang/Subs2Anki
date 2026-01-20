/// <reference lib="dom" />
import React, {useEffect, useRef} from 'react';
import {Virtuoso, VirtuosoHandle} from 'react-virtuoso';
import {FileText, FolderOpen, Save, Download, AlertCircle, Lock, Unlock, PlusCircle} from 'lucide-react';
import {parseSubtitles} from '@/core/parser.ts';
import {SubtitleLine} from '@/core/types.ts';
import {formatTime} from '@/core/time.ts';

interface SubtitleColumnProps {
  subtitleLines: SubtitleLine[];
  activeSubtitleLineId: number | null;
  subtitleFileName: string;
  canSave: boolean;
  onSetSubtitles: (lines: SubtitleLine[], fileName: string, fileHandle: any) => void;
  onUpdateText: (id: number, text: string) => void;
  onPlaySubtitle: (id: number) => void;
  onToggleLock: (id: number) => void;
  onCreateCard: (sub: SubtitleLine) => void;
  onSave: () => void;
  onDownload: () => void;
}

const SubtitleColumn: React.FC<SubtitleColumnProps> = ({
                                                         subtitleLines,
                                                         activeSubtitleLineId,
                                                         subtitleFileName,
                                                         canSave,
                                                         onSetSubtitles,
                                                         onUpdateText,
                                                         onPlaySubtitle,
                                                         onToggleLock,
                                                         onCreateCard,
                                                         onSave,
                                                         onDownload
                                                       }) => {
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    if (activeSubtitleLineId)
    {
      const i = subtitleLines.findIndex(line => line.id === activeSubtitleLineId);
      if (i !== -1)
      {
        virtuosoRef.current?.scrollToIndex({index: i, align: 'center', behavior: 'smooth'});
      }
    }
  }, [activeSubtitleLineId]);

  const handleOpenSubtitle = async () => {
    try {
      // @ts-ignore
      if (window.showOpenFilePicker) {
        // @ts-ignore
        const [handle] = await window.showOpenFilePicker({
          types: [{description: 'Subtitle Files', accept: {'text/plain': ['.srt', '.vtt']}}],
          multiple: false,
        });
        const file = await handle.getFile();
        const text = await file.text();
        onSetSubtitles(parseSubtitles(text), file.name, handle);
        return;
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error("File picker failed", err);
      else return;
    }
    subtitleInputRef.current?.click();
  };

  const handleSubtitleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const lines = parseSubtitles(e.target?.result as string);
        onSetSubtitles(lines, file.name, null);
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const renderSubtitleRow = (index: number) => {
    const sub = subtitleLines[index];
    const isActive = sub.id === activeSubtitleLineId;

    return (
      <div
        key={sub.id}
        id={`sub-${sub.id}`}
        onClick={() => onPlaySubtitle(sub.id)}
        className={`group flex items-start gap-2 p-2 mx-2 mb-1 rounded transition-all cursor-pointer border ${isActive ? 'bg-slate-800 border-indigo-500/50 shadow-md' : 'border-transparent hover:bg-slate-800/50'}`}
      >
        <button onClick={(e) => {
          e.stopPropagation();
          onToggleLock(sub.id);
        }} className={`mt-1 ${sub.locked ? 'text-red-400' : 'text-slate-700 group-hover:text-slate-500'}`}>{sub.locked ?
          <Lock size={12}/> : <Unlock size={12}/>}</button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <span
              className={`text-[10px] font-mono ${isActive ? 'text-indigo-400' : 'text-slate-600'}`}>{formatTime(sub.startTime)} - {formatTime(sub.endTime)}</span>
          </div>
          <textarea value={sub.text} onChange={(e) => onUpdateText(sub.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()} rows={2} readOnly={sub.locked}
                    className={`w-full bg-transparent resize-none outline-none text-sm leading-snug ${sub.locked ? 'text-slate-500' : isActive ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}/>
        </div>
        <button onClick={(e) => {
          e.stopPropagation();
          onCreateCard(sub);
        }} className={`mt-1 text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition`}
                title="Create Card"><PlusCircle size={16}/></button>
      </div>
    );
  };

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col border-l border-slate-800 bg-slate-900/50 z-20">
      <div
        className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="flex items-center gap-2 text-slate-400 text-xs tracking-wider">
          <FileText size={36}/> {subtitleFileName || 'Subtitle'}
        </div>

        <div className="flex items-center gap-1">
          {/* Save Controls */}
          {subtitleLines.length > 0 && (
            <>
              <div className="relative">
                {canSave && <button onClick={onSave}
                                    className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2 rounded">
                  <Save size={16}/> Save
                </button>}
                {canSave || <button onClick={onDownload}
                                    className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2 rounded">
                  <Download size={16}/> Download
                </button>}
              </div>
            </>
          )}
          <button onClick={handleOpenSubtitle} className="p-2 hover:bg-slate-700 rounded text-indigo-400 transition"
                  title="Load Subtitles">
            <FolderOpen size={16}/>
          </button>
          <input ref={subtitleInputRef} type="file" accept=".srt,.vtt" onChange={handleSubtitleInputChange}
                 className="hidden"/>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-slate-900 pt-2">
        {subtitleLines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs">
            <AlertCircle size={24} className="mb-2 opacity-50"/>No content
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            totalCount={subtitleLines.length}
            className="custom-scrollbar"
            itemContent={renderSubtitleRow}
          />
        )}
      </div>
    </aside>
  );
};

export default SubtitleColumn;