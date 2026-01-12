
import React, {useState, useRef} from 'react';
import {SubtitleLine, AnkiCard} from '../core/types';
import {parseSubtitles, serializeSubtitles} from '../core/parser';
import {formatTime} from '../core/time';
import {analyzeSubtitle} from '../core/gemini';
import {generateAnkiDeck} from '../core/export';
import saveAs from 'file-saver';
import VideoPlayer, {VideoPlayerHandle} from './components/VideoPlayer';
import WaveformDisplay from './components/WaveformDisplay';
import CardItem from './components/CardItem';
import TemplateEditorModal from './components/TemplateEditorModal';
import EditSubtitleLineModal from './components/EditSubtitleLineModal';
import LLMSettingsModal from './components/LLMSettingsModal';
import TempSubtitleLineControls from './components/controls/TempSubtitleLineControls';
import ActiveSubtitleLineControls from './components/controls/ActiveSubtitleLineControls';
import DefaultControls from './components/controls/DefaultControls';
import { useAppStore } from '../core/store';
import {
  FileText,
  Download,
  PlusCircle,
  Layers,
  AlertCircle,
  Save,
  FolderOpen,
  Lock,
  Unlock,
  Settings,
} from 'lucide-react';

const App: React.FC = () => {
  // --- Global State from Zustand ---
  const {
    videoSrc, videoName, setVideo,
    subtitleLines, subtitleFileName, fileHandle, setSubtitles,
    updateSubtitleText, updateSubtitleTime, toggleSubtitleLock, addSubtitle, removeSubtitle,
    ankiCards, addCard, updateCard, deleteCard,
    ankiConfig, setAnkiConfig,
    llmSettings, setLLMSettings,
    processing, setProcessing
  } = useAppStore();

  // --- Local UI State (Transient) ---
  const [pauseAtTime, setPauseAtTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeSubtitleId, setActiveSubtitleId] = useState<number | null>(null);

  // Modals
  const [isNewSubtitleModalOpen, setIsNewSubtitleModalOpen] = useState<boolean>(false);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isLLMSettingsOpen, setIsLLMSettingsOpen] = useState<boolean>(false);

  // Editing context
  const [editingSubId, setEditingSubId] = useState<number | null>(null);

  // Renamed from tempSegment to tempSubtitleLine
  const [tempSubtitleLine, setTempSubtitleLine] = useState<{start: number, end: number} | null>(null);

  // Refs
  const videoRef = useRef<VideoPlayerHandle>(null);
  const subtitleListRef = useRef<HTMLDivElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideo(url, file.name);
      // NOTE: We no longer decode the full audio here to avoid OOM on large files.
      // WaveformDisplay will handle playback via MediaElement.
    }
  };

  const handleOpenSubtitle = async () => {
    try {
      // @ts-ignore
      if (window.showOpenFilePicker) {
        // @ts-ignore
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Subtitle Files', accept: { 'text/plain': ['.srt', '.vtt'] } }],
          multiple: false,
        });
        const file = await handle.getFile();
        const text = await file.text();
        setSubtitles(parseSubtitles(text), file.name, handle);
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
        setSubtitles(lines, file.name, null);
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  // --- Temp Subtitle Line Workflow (Renamed) ---

  const handleTempSubtitleLineCreated = (start: number, end: number) => {
    setEditingSubId(null);
    setTempSubtitleLine({ start, end });
  };

  const handleTempSubtitleLineUpdated = (start: number, end: number) => {
    setTempSubtitleLine({ start, end });
  };

  const handleTempSubtitleLineRemoved = () => {
    setTempSubtitleLine(null);
  }

  const playTimeSpan = (start: number, end: number) => {
    setPauseAtTime(end);
    videoRef.current?.seekTo(start);
    videoRef.current?.play();
  }

  const handleTempSubtitleLineClicked = () => {
    if (!tempSubtitleLine) return;
    playTimeSpan(tempSubtitleLine.start, tempSubtitleLine.end);
  };

  const handleCommitTempSubtitleLine = () => {
    if (!tempSubtitleLine) return;
    videoRef.current?.pause();
    setIsNewSubtitleModalOpen(true);
  };

  // --- Edit Existing Subtitle ---

  const handleEditSubtitle = (id: number) => {
    // Use store state directly
    const sub = useAppStore.getState().subtitleLines.find(s => s.id === id);
    if (!sub) return;

    videoRef.current?.pause();
    videoRef.current?.seekTo(sub.startTime);
    setEditingSubId(id);
    setTempSubtitleLine(null);
    setIsNewSubtitleModalOpen(true);
  };

  const handleSaveSubtitleFromModal = (text: string) => {
    if (editingSubId !== null) {
      updateSubtitleText(editingSubId, text);
    } else if (tempSubtitleLine) {
      // Creating new from temp segment
      const lines = useAppStore.getState().subtitleLines;
      const maxId = lines.reduce((max, s) => Math.max(max, s.id), 0);
      const newSub: SubtitleLine = {
        id: maxId + 1,
        startTime: tempSubtitleLine.start,
        endTime: tempSubtitleLine.end,
        text,
        locked: false
      };
      addSubtitle(newSub);
      setTempSubtitleLine(null);
    }
  };

  const handleRemoveBtnClicked = () => {
    if (editingSubId) {
      removeSubtitle(editingSubId);
    }
  };

  const handleSaveSubtitles = async () => {
    if (!subtitleFileName) return;
    if (fileHandle) {
      try {
        const isVtt = subtitleFileName.toLowerCase().endsWith('.vtt');
        const content = serializeSubtitles(subtitleLines, isVtt ? 'vtt' : 'srt');
        // @ts-ignore
        const writable = await fileHandle.createWritable();
        // @ts-ignore
        await writable.write(content);
        // @ts-ignore
        await writable.close();
        useAppStore.getState().setHasUnsavedChanges(false);
      } catch (err) { alert('Failed to save file.'); }
    } else {
      useAppStore.getState().setHasUnsavedChanges(false);
    }
    setIsSaveMenuOpen(false);
  };

  const handleDownloadSubtitles = async () => {
    if (!subtitleFileName) return;
    const isVtt = subtitleFileName.toLowerCase().endsWith('.vtt');
    const content = serializeSubtitles(subtitleLines, isVtt ? 'vtt' : 'srt');
    try {
      // @ts-ignore
      if (window.showSaveFilePicker) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({ suggestedName: subtitleFileName, types: [{ description: 'Subtitle File', accept: { 'text/plain': [isVtt ? '.vtt' : '.srt'] } }] });
        // @ts-ignore
        const writable = await handle.createWritable();
        // @ts-ignore
        await writable.write(content);
        // @ts-ignore
        await writable.close();
      } else {
        const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
        saveAs(blob, subtitleFileName);
        useAppStore.getState().setHasUnsavedChanges(false);
      }
    } catch (err) {}
    setIsSaveMenuOpen(false);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    if (pauseAtTime !== null && time >= pauseAtTime) {
      videoRef.current?.pause();
      videoRef.current?.seekTo(pauseAtTime);
      setPauseAtTime(null);
    }
    const active = subtitleLines.find(s => time >= s.startTime && time <= s.endTime);
    if (active && active.id !== activeSubtitleId) {
      setActiveSubtitleId(active.id);
      const el = document.getElementById(`sub-${active.id}`);
      if (el && subtitleListRef.current) el.scrollIntoView({behavior: 'smooth', block: 'center'});
    } else if (!active) setActiveSubtitleId(null);
  };

  const handleSeek = (time: number) => {
    setPauseAtTime(null);
    videoRef.current?.seekTo(time);
  };

  const handlePlaySubtitle = (id: number) => {
    // Grab fresh from store to ensure no stale data
    const sub = useAppStore.getState().subtitleLines.find(s => s.id === id);

    if (sub && videoRef.current) {
      setTempSubtitleLine(null);
      playTimeSpan(sub.startTime, sub.endTime);
    }
  };

  const handleCreateCard = async (sub: SubtitleLine) => {
    if (!videoRef.current) return;
    // Audio slicing disabled for performance/stability on large files without ffmpeg.wasm
    const audioBlob: Blob | null = null;

    setPauseAtTime(null);
    const screenshot = await videoRef.current.captureFrameAt(sub.startTime);
    const newCard: AnkiCard = { id: crypto.randomUUID(), subtitleId: sub.id, text: sub.text, translation: '', notes: '', screenshotDataUrl: screenshot || null, audioBlob: audioBlob, timestampStr: formatTime(sub.startTime) };

    addCard(newCard);

    if (llmSettings.autoAnalyze) await handleAnalyzeCard(newCard);
  };

  const handleAnalyzeCard = async (card: AnkiCard) => {
    setProcessing({ isAnalyzing: true });

    // Get fresh context
    const lines = useAppStore.getState().subtitleLines;
    const subIndex = lines.findIndex(s => s.id === card.subtitleId);

    const result = await analyzeSubtitle(
      card.text,
      lines[subIndex - 1]?.text,
      lines[subIndex + 1]?.text,
      llmSettings
    );

    updateCard(card.id, {
      translation: result.translation,
      notes: `${result.notes} \nVocab: ${result.keyWords.join(', ')}`
    });

    setProcessing({ isAnalyzing: false });
  };

  const handleExport = async () => await generateAnkiDeck(ankiCards, videoName, ankiConfig);

  // Helper to render the correct control bar
  const renderControlBar = () => {
    if (tempSubtitleLine) {
      console.assert(activeSubtitleId === null);
      return (
        <TempSubtitleLineControls
          start={tempSubtitleLine.start}
          end={tempSubtitleLine.end}
          onPlay={handleTempSubtitleLineClicked}
          onCommit={handleCommitTempSubtitleLine}
          onDiscard={handleTempSubtitleLineRemoved}
        />
      );
    }

    if (activeSubtitleId !== null) {
      return (
        <ActiveSubtitleLineControls
          videoName={videoName}
          currentTime={currentTime}
          llmSettings={llmSettings}
          onVideoUpload={handleVideoUpload}
          onOpenLLMSettings={() => setIsLLMSettingsOpen(true)}
          onReplay={() => handlePlaySubtitle(activeSubtitleId)}
        />
      );
    }

    return (
      <DefaultControls
        videoName={videoName}
        currentTime={currentTime}
        llmSettings={llmSettings}
        onVideoUpload={handleVideoUpload}
        onOpenLLMSettings={() => setIsLLMSettingsOpen(true)}
      />
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">

      {/* Top Part: 3 Columns */}
      <div className="flex flex-1 min-h-0 w-full">

        {/* COL 1: DECK (Left) */}
        <aside className="w-80 flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-900/50 z-20">

          {/* Logo Section */}
          <div className="h-14 flex items-center px-4 border-b border-slate-800 bg-slate-950 select-none">
            <div className="flex items-center gap-2 text-indigo-400">
              <Layers size={20} className="text-indigo-500" />
              <span className="text-lg font-bold tracking-tight text-slate-200">Subs2Anki</span>
            </div>
          </div>

          {/* Deck Header */}
          <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deck ({ankiCards.length})</h2>
            <div className="flex gap-1">
              <button onClick={() => setIsTemplateModalOpen(true)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition" title="Template Settings"><Settings size={14}/></button>
              <button onClick={handleExport} disabled={ankiCards.length === 0} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition disabled:opacity-50 disabled:bg-slate-700" title="Export Deck"><Download size={14}/></button>
            </div>
          </div>

          {/* Deck List */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
            {ankiCards.length === 0 ? <div className="text-center py-10 text-slate-600 text-xs">No cards yet</div> : ankiCards.map(card => <CardItem key={card.id} card={card} onDelete={deleteCard} onAnalyze={handleAnalyzeCard} isAnalyzing={processing.isAnalyzing} />)}
          </div>
        </aside>

        {/* COL 2: VIDEO (Center) */}
        <main className="flex-1 flex flex-col bg-slate-950 relative min-w-0">
          {/* Video Player Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 bg-black/20 min-h-0">
            <div className="w-full h-full max-w-5xl flex flex-col justify-center">
              <VideoPlayer ref={videoRef} src={videoSrc} onTimeUpdate={handleTimeUpdate} />
            </div>
          </div>
        </main>

        {/* COL 3: SUBTITLES (Right) */}
        <aside className="w-80 flex-shrink-0 flex flex-col border-l border-slate-800 bg-slate-900/50 z-20">
          <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
              <FileText size={16} /> Subtitles
            </div>

            <div className="flex items-center gap-1">
              <button onClick={handleOpenSubtitle} className="p-2 hover:bg-slate-700 rounded text-indigo-400 transition" title="Load Subtitles">
                <FolderOpen size={16} />
              </button>
              <input ref={subtitleInputRef} type="file" accept=".srt,.vtt" onChange={handleSubtitleInputChange} className="hidden" />

              {subtitleLines.length > 0 && (
                <div className="relative">
                  <button onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)} className="p-2 hover:bg-slate-700 rounded text-slate-400 transition" title="Save/Download">
                    <Save size={16} />
                  </button>
                  {isSaveMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSaveMenuOpen(false)}></div>
                      <div className="absolute top-full right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 overflow-hidden">
                        <button onClick={handleSaveSubtitles} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                          <Save size={14} /> Save
                        </button>
                        <button onClick={handleDownloadSubtitles} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                          <Download size={14} /> Download
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Subtitle List */}
          <div ref={subtitleListRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-1 bg-slate-900">
            {subtitleLines.length === 0 && <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs"><AlertCircle size={24} className="mb-2 opacity-50"/>No subtitles loaded</div>}
            {subtitleLines.map(sub => {
              const isActive = sub.id === activeSubtitleId;
              return (
                <div key={sub.id} id={`sub-${sub.id}`} onClick={() => handlePlaySubtitle(sub.id)} className={`group flex items-start gap-2 p-2 rounded transition-all cursor-pointer border ${isActive ? 'bg-slate-800 border-indigo-500/50 shadow-md' : 'border-transparent hover:bg-slate-800/50'}`}>
                  <button onClick={(e) => {e.stopPropagation(); toggleSubtitleLock(sub.id);}} className={`mt-1 ${sub.locked ? 'text-red-400' : 'text-slate-700 group-hover:text-slate-500'}`}>{sub.locked ? <Lock size={12}/> : <Unlock size={12}/>}</button>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-mono ${isActive ? 'text-indigo-400' : 'text-slate-600'}`}>{formatTime(sub.startTime)}</span>
                    </div>
                    <textarea value={sub.text} onChange={(e) => updateSubtitleText(sub.id, e.target.value)} onClick={(e) => e.stopPropagation()} rows={2} readOnly={sub.locked} className={`w-full bg-transparent resize-none outline-none text-sm leading-snug ${sub.locked ? 'text-slate-500' : isActive ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}/>
                  </div>
                  <button onClick={(e) => {e.stopPropagation(); handleCreateCard(sub);}} className={`mt-1 text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition`} title="Create Card"><PlusCircle size={16}/></button>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* Control Bar - Full Width */}
      <div className="h-16 border-t border-slate-800 bg-slate-900 flex items-center justify-center shrink-0 shadow-xl z-30 px-4 gap-4 transition-all w-full">
        {renderControlBar()}
      </div>

      {/* Bottom Part: Full-width Waveform */}
      <div className="h-48 flex-shrink-0 border-t border-slate-800 bg-slate-900 z-10 w-full relative">
        <WaveformDisplay
          videoElement={videoRef.current?.getVideoElement() || null}
          currentTime={currentTime}
          onSeek={handleSeek}
          onTempSubtitleLineCreated={handleTempSubtitleLineCreated}
          onTempSubtitleLineUpdated={handleTempSubtitleLineUpdated}
          onTempSubtitleLineClicked={handleTempSubtitleLineClicked}
          onTempSubtitleLineRemoved={handleTempSubtitleLineRemoved}
          onEditSubtitle={handleEditSubtitle}
          onPlaySubtitle={handlePlaySubtitle}
          onToggleLock={toggleSubtitleLock}
          onCreateCard={(id) => {
            const s = useAppStore.getState().subtitleLines.find(x => x.id === id);
            if(s) handleCreateCard(s);
          }}
        />
      </div>

      {/* Modals */}
      <TemplateEditorModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} config={ankiConfig} onSave={setAnkiConfig} />
      <LLMSettingsModal isOpen={isLLMSettingsOpen} onClose={() => setIsLLMSettingsOpen(false)} settings={llmSettings} onSave={setLLMSettings} />
      <EditSubtitleLineModal
        isOpen={isNewSubtitleModalOpen}
        onRemove={handleRemoveBtnClicked}
        onClose={() => setIsNewSubtitleModalOpen(false)}
        startTime={tempSubtitleLine ? tempSubtitleLine.start : (editingSubId ? (subtitleLines.find(s => s.id === editingSubId)?.startTime || 0) : 0)}
        endTime={tempSubtitleLine ? tempSubtitleLine.end : (editingSubId ? (subtitleLines.find(s => s.id === editingSubId)?.endTime || 0) : 0)}
        initialText={editingSubId !== null ? subtitleLines.find(s => s.id === editingSubId)?.text : ''}
        audioBlob={null}
        llmSettings={llmSettings}
        onSave={handleSaveSubtitleFromModal}
      />
    </div>
  );
};

export default App;
