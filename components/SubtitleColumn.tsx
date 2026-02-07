import React, {useEffect, useRef, useState, useMemo} from 'react';
import {Virtuoso, VirtuosoHandle} from 'react-virtuoso';
import {
  FileText,
  FolderOpen,
  Save,
  Download,
  AlertCircle,
  Lock,
  Unlock,
  PlusCircle,
  Search,
  X,
  MoveHorizontal,
  EyeOff
} from 'lucide-react';
import {parseSubtitles} from '@/services/parser.ts';
import {SubtitleLine} from '@/services/types.ts';
import {formatTimestamp} from '@/services/time.ts';

interface SubtitleColumnProps {
  subtitleLines: SubtitleLine[];
  activeSubtitleLineId: number | null;
  subtitleFileName: string;
  canSave: boolean;
  onSetSubtitles: (lines: SubtitleLine[], fileName: string, fileHandle: any) => void;
  onSubtitleLineClicked: (id: number, copyText?: boolean) => void;
  onToggleLock: (id: number) => void;
  onCreateCard: (sub: SubtitleLine) => void;
  onBulkCreateCards: () => void;
  onSave: () => void;
  onDownload: () => void;
  onShiftSubtitles: (offset: number) => void;
  className?: string;
}

const SubtitleColumn: React.FC<SubtitleColumnProps> = ({
                                                         subtitleLines,
                                                         activeSubtitleLineId,
                                                         subtitleFileName,
                                                         canSave,
                                                         onSetSubtitles,
                                                         onSubtitleLineClicked,
                                                         onToggleLock,
                                                         onCreateCard,
                                                         onBulkCreateCards,
                                                         onSave,
                                                         onDownload,
                                                         onShiftSubtitles,
                                                         className = ''
                                                       }) => {
  const MIN_SHIFT_MS = 10;
  const [isShiftMenuOpen, setIsShiftMenuOpen] = useState(false);
  const [shiftAmount, setShiftAmount] = useState(MIN_SHIFT_MS);

  // 状态过滤
  const [statusFilters, setStatusFilters] = useState<Record<'normal' | 'locked' | 'ignored', boolean>>({
    normal: true,
    locked: true,
    ignored: true
  });

  const handleShiftAmountChanged = (shiftAmountString: string) => {
    const val = parseFloat(shiftAmountString);
    if (!isNaN(val) && val > 0) {
      setShiftAmount(val);
    } else {
      setShiftAmount(MIN_SHIFT_MS);
    }
  }

  const handleStatusFilterChange = (status: 'normal' | 'locked' | 'ignored') => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const handleQuickShift = (ms: number) => {
    onShiftSubtitles(ms / 1000);
  };

  // Shared button styles
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

  // 计算每种状态类型的字幕行数量
  const subtitleCounts = useMemo(() => {
    return subtitleLines.reduce((counts, sub) => {
      counts[sub.status]++;
      return counts;
    }, {normal: 0, locked: 0, ignored: 0} as Record<'normal' | 'locked' | 'ignored', number>);
  }, [subtitleLines]);

  // 过滤字幕行
  const filteredSubtitleLines = useMemo(() =>
    subtitleLines.filter(sub =>
      statusFilters[sub.status]
    ), [subtitleLines, statusFilters]
  );

  // 更新过滤索引以匹配过滤后的数组
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredIndices([]);
      setCurrentSearchIndex(0);
      return;
    }

    const indices = filteredSubtitleLines
      .map((line, index) => ({line, index}))
      .filter(({line}) =>
        line.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(({index}) => index);

    setFilteredIndices(indices);
    setCurrentSearchIndex(0);
  }, [searchTerm, filteredSubtitleLines]);

  const renderSubtitleRow = (index: number) => {
    const sub = filteredSubtitleLines[index];
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
        onClick={() => onSubtitleLineClicked(sub.id, true)}
        className={`group flex items-start gap-2 p-2 mx-2 mb-1 rounded transition-all cursor-pointer border ${
          isActive
            ? 'bg-slate-800 border-indigo-500/50 shadow-md'
            : 'border-transparent hover:bg-slate-800/50'
        }`}
      >
        <button onClick={(e) => {
          e.stopPropagation();
          onToggleLock(sub.id);
        }}
                className={`mt-1 ${sub.status === 'locked' ? 'text-red-400' : sub.status === 'ignored' ? 'text-green-400' : 'text-slate-700 group-hover:text-slate-500'}`}>
          {sub.status === 'locked' ? <Lock size={12}/> : sub.status === 'ignored' ? <EyeOff size={12}/> :
            <Unlock size={12}/>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <span
              className={`text-[10px] font-mono ${
                isActive
                  ? 'text-indigo-400'
                  : 'text-slate-600'
              }`}>
              {formatTimestamp(sub.startTime)} - {formatTimestamp(sub.endTime)}
            </span>
          </div>
          <div className="relative">
            <div
              className={`w-full bg-transparent resize-none outline-none text-sm leading-snug ${
                (sub.status === 'locked' || sub.status === 'ignored')
                  ? 'text-slate-500'
                  : isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
              }`}
              style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}
            >
              {searchTerm ? highlightText(sub.text, searchTerm, isCurrentSearchResult) : sub.text}
            </div>
          </div>
        </div>
        {sub.status === 'normal' &&
          <button
            title="Create Card"
            className="mt-1 text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition"
            onClick={(e) => {
              e.stopPropagation();
              onCreateCard(sub);
            }}>
            <PlusCircle size={16}/>
          </button>
        }
      </div>
    );
  };

  return (
    <aside className={`w-80 flex-shrink-0 flex flex-col border-l border-slate-800 bg-slate-900/50 z-20 ${className}`}>
      {/* Header with file info and controls */}
      <div className="flex flex-col px-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="h-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs tracking-wider">
            <FileText size={16}/> <span>{subtitleFileName || 'Subtitle'}</span>
          </div>

          {subtitleLines.length <= 0 && <div className="flex items-center gap-1">
            <button onClick={handleOpenSubtitle} className="p-2 hover:bg-slate-700 rounded text-indigo-400 transition"
                    title="Load Subtitles">
              <FolderOpen size={16}/>
            </button>
            <input ref={subtitleInputRef} type="file" accept=".srt,.vtt" onChange={handleSubtitleInputChange}
                   className="hidden"/>
          </div>}
        </div>

        {/* Save Controls - shown on a separate line when needed */}
        {subtitleLines.length > 0 && (
          <div className="flex flex-col">
            <div className="h-10 flex items-center justify-end pb-2">
              <div className="flex items-center gap-1">
                {/* Global Shift Button - placed to the left of Save button */}
                <button
                  onClick={() => setIsShiftMenuOpen(!isShiftMenuOpen)}
                  className={`w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2 rounded ${isShiftMenuOpen ? 'bg-slate-700' : ''}`}
                  title="Global Time Shift"
                >
                  <MoveHorizontal size={16}/> Global Shift
                </button>

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
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleOpenSubtitle}
                        className="p-2 hover:bg-slate-700 rounded text-indigo-400 transition"
                        title="Load Subtitles">
                  <FolderOpen size={16}/>
                </button>
                <input ref={subtitleInputRef} type="file" accept=".srt,.vtt" onChange={handleSubtitleInputChange}
                       className="hidden"/>
              </div>
            </div>

            {/* Global Shift Controls - shown below the buttons when open */}
            {isShiftMenuOpen && (
              <div className="px-4 pb-2">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                  <h4 className="text-[10px] font-bold text-slate-500 mb-2 uppercase text-center tracking-wider">Global
                    Offset</h4>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => handleQuickShift(-shiftAmount)}
                            className="h-8 flex-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs text-slate-300 font-mono transition-colors">-{shiftAmount}ms
                    </button>
                    <div className="relative">
                      <input
                        type="number"
                        value={shiftAmount}
                        onChange={(e) => handleShiftAmountChanged(e.target.value)}
                        step={MIN_SHIFT_MS}
                        min={MIN_SHIFT_MS}
                        className="w-16 h-8 bg-slate-900 border border-slate-600 rounded px-1 text-sm text-white focus:border-indigo-500 outline-none text-center font-mono"
                      />
                    </div>
                    <button onClick={() => handleQuickShift(shiftAmount)}
                            className="h-8 flex-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs text-slate-300 font-mono transition-colors">+{shiftAmount}ms
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Create Button */}
      <div className="h-10 flex items-center px-4 bg-slate-900/60">
        <button
          onClick={onBulkCreateCards}
          disabled={subtitleCounts.normal === 0}
          className={`flex items-center gap-2 px-3 py-1 text-xs rounded ${
            subtitleCounts.normal === 0
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
          title={subtitleCounts.normal === 0 ? 'No normal subtitles to create cards from' : 'Create cards for all normal subtitles'}
        >
          <PlusCircle size={14}/> Bulk Create Cards ({subtitleCounts.normal})
        </button>
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

      {/* Status Filters */}
      <div className="h-8 flex items-center px-4 bg-slate-900/40 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={statusFilters.normal}
              onChange={() => handleStatusFilterChange('normal')}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-400">Normal ({subtitleCounts.normal})</span>
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={statusFilters.locked}
              onChange={() => handleStatusFilterChange('locked')}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-red-400">Locked ({subtitleCounts.locked})</span>
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={statusFilters.ignored}
              onChange={() => handleStatusFilterChange('ignored')}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-green-400">Ignored ({subtitleCounts.ignored})</span>
          </label>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-slate-900 pt-2">
        {filteredSubtitleLines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs">
            <AlertCircle size={24} className="mb-2 opacity-50"/>
            {subtitleLines.length === 0 ? 'No content' : 'No visible subtitles'}
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            totalCount={filteredSubtitleLines.length}
            className="custom-scrollbar"
            itemContent={renderSubtitleRow}
          />
        )}
      </div>
    </aside>
  );
};

export default SubtitleColumn;