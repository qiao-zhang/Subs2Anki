/// <reference lib="dom" />
import React, {useEffect, useRef, useState} from 'react';
import {Virtuoso, VirtuosoHandle} from 'react-virtuoso';
import {FileText, FolderOpen, Save, Download, AlertCircle, Lock, Unlock, PlusCircle, Search, X} from 'lucide-react';
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
  onSubtitleLineClicked: (id: number) => void;
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
                                                         onSubtitleLineClicked,
                                                         onToggleLock,
                                                         onCreateCard,
                                                         onSave,
                                                         onDownload
                                                       }) => {
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredIndices, setFilteredIndices] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(0);

  useEffect(() => {
    if (activeSubtitleLineId) {
      setSearchTerm('');
      const i = subtitleLines.findIndex(line => line.id === activeSubtitleLineId);
      if (i !== -1) {
        virtuosoRef.current?.scrollToIndex({index: i, align: 'center', behavior: 'smooth'});
      }
    }
  }, [activeSubtitleLineId]);

  // Filter subtitle lines based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredIndices([]);
      setCurrentSearchIndex(0);
      return;
    }

    const indices = subtitleLines
      .map((line, index) => ({line, index}))
      .filter(({line}) =>
        line.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(({index}) => index);

    setFilteredIndices(indices);
    setCurrentSearchIndex(0);
  }, [searchTerm, subtitleLines]);

  // Scroll to active subtitle or current search result
  useEffect(() => {
    if (filteredIndices.length <= 0) return;
    if (currentSearchIndex < 0 || currentSearchIndex > filteredIndices.length) return;
    const targetIndex = filteredIndices[currentSearchIndex];
    virtuosoRef.current?.scrollToIndex({index: targetIndex, align: 'center', behavior: 'auto'});
  }, [filteredIndices, currentSearchIndex, subtitleLines]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilteredIndices([]);
    setCurrentSearchIndex(0);
  };

  const goToNextSearchResult = () => {
    if (filteredIndices.length > 0) {
      setCurrentSearchIndex((prev) => (prev + 1) % filteredIndices.length);
    }
  };

  const goToPrevSearchResult = () => {
    if (filteredIndices.length > 0) {
      setCurrentSearchIndex((prev) =>
        prev === 0 ? filteredIndices.length - 1 : prev - 1
      );
    }
  };

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
    const isCurrentSearchResult = searchTerm && filteredIndices.length > 0 &&
      filteredIndices[currentSearchIndex] === index;

    // Highlight search terms in subtitle text
    const highlightText = (text: string, searchTerm: string, isCurrentSearchResult: boolean) => {
      if (!searchTerm.trim()) return <>{text}</>;

      const regex = new RegExp(`(${searchTerm})`, 'gi');
      const parts = text.split(regex);

      return parts.map((part, i) =>
        regex.test(part) ? (
          <span
            key={i}
            className={`${isCurrentSearchResult ? 'bg-orange-400 text-slate-900' : 'bg-yellow-300 text-slate-900'} rounded px-0.5`}
          >
            {part}
          </span>
        ) : part
      );
    };

    return (
      <div
        key={sub.id}
        id={`sub-${sub.id}`}
        onClick={() => onSubtitleLineClicked(sub.id)}
        className={`group flex items-start gap-2 p-2 mx-2 mb-1 rounded transition-all cursor-pointer border ${
          isActive
            ? 'bg-slate-800 border-indigo-500/50 shadow-md'
            : 'border-transparent hover:bg-slate-800/50'
        }`}
      >
        <button onClick={(e) => {
          e.stopPropagation();
          onToggleLock(sub.id);
        }} className={`mt-1 ${sub.locked ? 'text-red-400' : 'text-slate-700 group-hover:text-slate-500'}`}>{sub.locked ?
          <Lock size={12}/> : <Unlock size={12}/>}</button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <span
              className={`text-[10px] font-mono ${
                isActive
                  ? 'text-indigo-400'
                  : 'text-slate-600'
              }`}>
              {formatTime(sub.startTime)} - {formatTime(sub.endTime)}
            </span>
          </div>
          <div className="relative">
            {searchTerm ? (
              <div
                className={`w-full bg-transparent resize-none outline-none text-sm leading-snug ${
                  sub.locked
                    ? 'text-slate-500'
                    : isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-300'
                }`}
                style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}
              >
                {highlightText(sub.text, searchTerm, isCurrentSearchResult)}
              </div>
            ) : (
              <textarea
                value={sub.text}
                onChange={(e) => onUpdateText(sub.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                rows={2}
                readOnly={sub.locked}
                className={`w-full bg-transparent resize-none outline-none text-sm leading-snug ${
                  sub.locked
                    ? 'text-slate-500'
                    : isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-300'
                }`}
              />
            )}
          </div>
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
      {/* Header with file info and controls */}
      <div
        className="h-10 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="flex items-center gap-2 text-slate-400 text-xs tracking-wider">
          <FileText size={16}/> {subtitleFileName || 'Subtitle'}
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

      {/* Search bar */}
      <div className="h-10 flex items-center px-4 bg-slate-900/60">
        <div className="flex items-center gap-1 w-full">
          <div className="relative flex items-center flex-1">
            <Search size={16} className="absolute left-2 text-slate-500 z-10"/>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search subtitles..."
              className="w-full pl-8 pr-8 py-1 text-xs bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 text-slate-500 hover:text-slate-300"
              >
                <X size={14}/>
              </button>
            )}
          </div>

          {searchTerm && filteredIndices.length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={goToPrevSearchResult}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200"
                title="Previous result"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <span className="text-xs text-slate-400 mx-1">
                {currentSearchIndex + 1}/{filteredIndices.length}
              </span>
              <button
                onClick={goToNextSearchResult}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200"
                title="Next result"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}
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