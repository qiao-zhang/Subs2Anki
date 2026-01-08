import React, {useState, useRef, useMemo} from 'react';
import {SubtitleLine, AnkiCard, ProcessingState, AnkiNoteType} from '../core/types';
import {parseSubtitles, serializeSubtitles} from '../core/parser';
import {formatTime} from '../core/time';
import {analyzeSubtitle} from '../core/gemini';
import {generateAnkiDeck} from '../core/export';
import saveAs from 'file-saver';
import VideoPlayer, {VideoPlayerHandle} from './components/VideoPlayer';
import WaveformDisplay from './components/WaveformDisplay';
import CardItem from './components/CardItem';
import TemplateEditorModal from './components/TemplateEditorModal';
import {
  FileText,
  Download,
  PlusCircle,
  Layers,
  AlertCircle,
  Video as VideoIcon,
  Clock,
  Save,
  FolderOpen,
  X,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  Settings
} from 'lucide-react';

// Default Anki Note Type Configuration
const DEFAULT_NOTE_TYPE: AnkiNoteType = {
  id: 123456789, // This will be dynamic in real usage or random
  name: "Sub2Anki Basic",
  css: `.card {
 font-family: arial;
 font-size: 20px;
 text-align: center;
 color: black;
 background-color: white;
}
.sentence { font-size: 24px; color: #2d3748; margin-bottom: 20px; }
.translation { color: #047857; font-weight: bold; }
.notes { font-size: 16px; color: #4a5568; margin-top: 15px; text-align: left; }
.image { margin-top: 20px; }
img { max-width: 100%; border-radius: 8px; }`,
  fields: [
    { name: "Sentence", source: 'Text' },
    { name: "Meaning", source: 'Translation' },
    { name: "Notes", source: 'Notes' },
    { name: "Image", source: 'Image' },
    { name: "Audio", source: 'Audio' },
    { name: "Time", source: 'Time' }
  ],
  templates: [{
    Name: "Card 1",
    Front: `<div class="sentence">{{Sentence}}</div>`,
    Back: `<div class="sentence">{{Sentence}}</div>
<hr>
<div class="translation">{{Meaning}}</div>
<div class="notes">{{Notes}}</div>
<div class="image">{{Image}}</div>
<div class="time"><small>{{Time}}</small></div>`
  }]
};

/**
 * Main Application Component.
 *
 * Orchestrates the video playback, subtitle syncing, card creation, and export workflows.
 */
const App: React.FC = () => {
  // --- State Management ---

  // Video & Subtitle Source State
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [videoName, setVideoName] = useState<string>('');
  const [subtitleLines, setSubtitleLines] = useState<SubtitleLine[]>([]);
  const [subtitleFileName, setSubtitleFileName] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // File System Handle for saving back to original file
  const [fileHandle, setFileHandle] = useState<any>(null);

  //Qs for auto-pausing playback
  const [pauseAtTime, setPauseAtTime] = useState<number | null>(null);

  // Offset Modal State
  const [isOffsetModalOpen, setIsOffsetModalOpen] = useState<boolean>(false);
  const [tempOffsetMs, setTempOffsetMs] = useState<number>(0);

  //Ql Save Menu State
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState<boolean>(false);

  // Anki Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [ankiConfig, setAnkiConfig] = useState<AnkiNoteType>(DEFAULT_NOTE_TYPE);

  // Playback State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeSubtitleId, setActiveSubtitleId] = useState<number | null>(null);
  const [isVideoVisible, setIsVideoVisible] = useState<boolean>(true);

  // Deck Management State
  const [ankiCards, setAnkiCards] = useState<AnkiCard[]>([]);

  // AI Processing State
  const [processing, setProcessing] = useState<ProcessingState>({
    isAnalyzing: false,
    progress: 0,
    total: 0
  });

  // --- Refs ---
  const videoRef = useRef<VideoPlayerHandle>(null);
  const subtitleListRef = useRef<HTMLDivElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoName(file.name);
      setIsVideoVisible(true); // Auto-show video on upload
    }
  };

  const handleOpenSubtitle = async () => {
    try {
      // @ts-ignore - API might not be fully typed in all environments
      if (window.showOpenFilePicker) {
        // @ts-ignore
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'Subtitle Files',
            accept: {
              'text/plain': ['.srt', '.vtt'],
            },
          }],
          multiple: false,
        });

        const file = await handle.getFile();
        const text = await file.text();

        setSubtitleFileName(file.name);
        setSubtitleLines(parseSubtitles(text));
        setFileHandle(handle);
        setHasUnsavedChanges(false);
        return;
      }
    } catch (err) {
      // Ignore AbortError (user cancelled)
      if ((err as Error).name !== 'AbortError') {
        console.error("File picker failed", err);
      } else {
        return;
      }
    }

    // Fallback to hidden input if API not supported or failed
    subtitleInputRef.current?.click();
  };

  const handleSubtitleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSubtitleFileName(file.name);
      // We don't have a handle for files from input, so clear it
      setFileHandle(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const parsed = parseSubtitles(content);
        setSubtitleLines(parsed);
        setHasUnsavedChanges(false);
      };
      reader.readAsText(file);
    }
    // Reset value to allow re-selecting same file
    event.target.value = '';
  };

  const handleSubtitleTextChange = (id: number, newText: string) => {
    setSubtitleLines((prev: SubtitleLine[]) => prev.map((s: SubtitleLine) => {
      // If locked, do not update text
      if (s.id === id && s.locked) return s;
      return s.id === id ? { ...s, text: newText } : s;
    }));
    setHasUnsavedChanges(true);
  };

  const handleSubtitleTimeChange = (id: number, start: number, end: number) => {
    setSubtitleLines((prev: SubtitleLine[]) => prev.map((s: SubtitleLine) => {
      // If locked, do not update times
      if (s.id === id && s.locked) return s;
      return s.id === id ? { ...s, startTime: start, endTime: end } : s;
    }));
    setHasUnsavedChanges(true);
  };

  const toggleSubtitleLock = (id: number) => {
    setSubtitleLines((prev: SubtitleLine[]) => prev.map((s: SubtitleLine) =>
      s.id === id ? { ...s, locked: !s.locked } : s
    ));
  };

  /**
   * Applies the time offset to all subtitles in the baseline state.
   */
  const applyOffset = () => {
    const offsetSec = tempOffsetMs / 1000;
    setSubtitleLines((prev: SubtitleLine[]) => prev.map(s => {
      if (s.locked) return s; // Do not shift locked subtitles
      return {
        ...s,
        startTime: Math.max(0, s.startTime + offsetSec),
        endTime: Math.max(0, s.endTime + offsetSec)
      };
    }));
    setHasUnsavedChanges(true);
    setIsOffsetModalOpen(false);
    setTempOffsetMs(0); // Reset for next use
  };

  /**
   * Saves changes.
   * If we have a file handle (from File System Access API), write directly to disk.
   * Otherwise, just clear the dirty flag (save to memory).
   */
  const handleSaveSubtitles = async () => {
    if (!subtitleFileName) return;

    if (fileHandle) {
      try {
        const isVtt = subtitleFileName.toLowerCase().endsWith('.vtt');
        const content = serializeSubtitles(subtitleLines, isVtt ? 'vtt' : 'srt');

        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error('Failed to save file:', err);
        alert('Failed to save to original file.');
      }
    } else {
      // "Save" to memory (just clear dirty flag)
      setHasUnsavedChanges(false);
    }
  };

  /**
   * Explicitly download the current subtitle content as a file.
   * Attempts to use the native "Save As" file picker if available.
   */
  const handleDownloadSubtitles = async () => {
    if (!subtitleFileName) return;
    const isVtt = subtitleFileName.toLowerCase().endsWith('.vtt');
    const content = serializeSubtitles(subtitleLines, isVtt ? 'vtt' : 'srt');

    try {
      // @ts-ignore - API might not be fully typed in all environments
      if (window.showSaveFilePicker) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: subtitleFileName,
          types: [{
            description: 'Subtitle File',
            accept: {
              'text/plain': [isVtt ? '.vtt' : '.srt']
            }
          }],
        });

        // @ts-ignore
        const writable = await handle.createWritable();
        // @ts-ignore
        await writable.write(content);
        // @ts-ignore
        await writable.close();
      } else {
        // Fallback for browsers not supporting File System Access API
        const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
        saveAs(blob, subtitleFileName);
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      // Ignore AbortError (user cancelled)
      if ((err as Error).name !== 'AbortError') {
        console.error("Save failed", err);
      }
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);

    // Check if we need to auto-pause
    if (pauseAtTime !== null && time >= pauseAtTime) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setPauseAtTime(null); // Reset after pausing
    }

    const active = subtitleLines.find((s: SubtitleLine) => time >= s.startTime && time <= s.endTime);

    if (active && active.id !== activeSubtitleId) {
      setActiveSubtitleId(active.id);
      const el = document.getElementById(`sub-${active.id}`);
      if (el && subtitleListRef.current) {
        el.scrollIntoView({behavior: 'smooth', block: 'center'});
      }
    } else if (!active) {
      setActiveSubtitleId(null);
    }
  };

  const handleSeek = (time: number) => {
    // When manually seeking via waveform, clear any auto-pause logic
    setPauseAtTime(null);
    if (videoRef.current) {
      videoRef.current.seekTo(time);
    }
  };

  const handleSubtitleClick = (sub: SubtitleLine) => {
    // Even if hidden, the video player exists in DOM, so we can control it.
    if (videoRef.current) {
      // Set the point where the video should stop automatically
      setPauseAtTime(sub.endTime);

      videoRef.current.seekTo(sub.startTime);
      videoRef.current.play();
    }
  };

  const createCard = (sub: SubtitleLine) => {
    // Since video is in DOM, captureFrame works even if the video player is hidden (in most modern browsers).
    if (!videoRef.current) return;
    videoRef.current.pause();

    // Clear any pending pause action since we just manually paused
    setPauseAtTime(null);

    videoRef.current.seekTo(sub.startTime + (sub.endTime - sub.startTime) / 2);

    setTimeout(() => {
      const screenshot = videoRef.current?.captureFrame();

      const newCard: AnkiCard = {
        id: crypto.randomUUID(),
        subtitleId: sub.id,
        text: sub.text,
        translation: '',
        notes: '',
        screenshotDataUrl: screenshot || null,
        audioBlob: null,
        timestampStr: formatTime(sub.startTime)
      };
      setAnkiCards((prev: AnkiCard[]) => [newCard, ...prev]);
    }, 200);
  };

  const analyzeCard = async (card: AnkiCard) => {
    setProcessing((prev: ProcessingState) => ({...prev, isAnalyzing: true}));
    const subIndex = subtitleLines.findIndex((s: SubtitleLine) => s.id === card.subtitleId);
    const prevText = subtitleLines[subIndex - 1]?.text || "";
    const nextText = subtitleLines[subIndex + 1]?.text || "";

    const result = await analyzeSubtitle(card.text, prevText, nextText);

    setAnkiCards((prev: AnkiCard[]) => prev.map(c => {
      if (c.id === card.id) {
        return {
          ...c,
          translation: result.translation,
          notes: `${result.notes} \nVocab: ${result.keyWords.join(', ')}`
        };
      }
      return c;
    }));
    setProcessing((prev: ProcessingState) => ({...prev, isAnalyzing: false}));
  };

  const deleteCard = (id: string) => {
    setAnkiCards((prev: AnkiCard[]) => prev.filter(c => c.id !== id));
  };

  const handleExport = async () => {
    await generateAnkiDeck(ankiCards, videoName, ankiConfig);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200">

      {/* Template Editor Modal */}
      <TemplateEditorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        config={ankiConfig}
        onSave={setAnkiConfig}
      />

      {/* Offset Modal */}
      {isOffsetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock className="text-indigo-400" size={20} /> Shift Time
              </h3>
              <button onClick={() => setIsOffsetModalOpen(false)} className="text-slate-500 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              Shift all subtitle timestamps by milliseconds. Use positive for delay, negative for advance.
            </p>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Offset (ms)</label>
                <input
                  type="number"
                  autoFocus
                  value={tempOffsetMs}
                  onChange={(e) => setTempOffsetMs(parseInt(e.target.value) || 0)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-mono text-lg"
                  placeholder="e.g. 500 or -200"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsOffsetModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={applyOffset}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar: Controls & Card List */}
      <aside className="w-96 flex flex-col border-r border-slate-800 bg-slate-900/50">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2 mb-4">
            <Layers className="text-indigo-500"/> Sub2Anki AI
          </h1>

          <div className="space-y-3">
            <label className="flex items-center gap-2 w-full p-2 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer transition text-sm">
              <VideoIcon size={16}/>
              <span className="truncate">{videoName || "Select Video File"}</span>
              <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden"/>
            </label>
          </div>
        </div>

        {/* Deck / Cards Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-slate-300">Your Deck ({ankiCards.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded transition"
                title="Configure Anki Note Type"
              >
                <Settings size={14} />
              </button>
              {ankiCards.length > 0 && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full transition"
                >
                  <Download size={14}/> Export
                </button>
              )}
            </div>
          </div>

          {ankiCards.length === 0 ? (
            <div className="text-center py-10 text-slate-600">
              <p className="mb-2">No cards created yet.</p>
              <p className="text-xs">Load media, then click the (+) button on a line to start.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ankiCards.map(card => (
                <CardItem
                  key={card.id}
                  card={card}
                  onDelete={deleteCard}
                  onAnalyze={analyzeCard}
                  isAnalyzing={processing.isAnalyzing}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content: Video & Subtitle Browser */}
      <main className="flex-1 flex flex-col min-w-0 relative">

        {/* Toggle Arrow Handle */}
        <div
          onClick={() => setIsVideoVisible(!isVideoVisible)}
          className="w-full h-6 bg-slate-900 border-b border-slate-800 hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors z-30 shadow-sm"
          title={isVideoVisible ? "Collapse Video Area" : "Expand Video Area"}
        >
          {isVideoVisible ? (
            <ChevronUp size={16} className="text-slate-500 group-hover:text-slate-300" />
          ) : (
            <ChevronDown size={16} className="text-slate-500 group-hover:text-slate-300" />
          )}
        </div>

        {/* Top: Video Player - Hidden from UI when collapsed but remains in DOM */}
        <div className={`bg-black/20 flex flex-col transition-all ${isVideoVisible ? '' : 'hidden'}`}>
          <div className="p-4 border-b border-slate-800 flex justify-center">
            <div className="w-full max-w-4xl">
              <VideoPlayer ref={videoRef} src={videoSrc} onTimeUpdate={handleTimeUpdate} />
            </div>
          </div>
        </div>

        {/* Waveform Visualization (Always visible if video loaded) */}
        {videoSrc && (
          <WaveformDisplay
            audioSrc={videoSrc}
            currentTime={currentTime}
            onSeek={handleSeek}
            subtitles={subtitleLines}
            onSubtitleChange={handleSubtitleTimeChange}
          />
        )}

        {/* Bottom: Subtitle List */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-900">

          {/* Subtitle Browser Toolbar */}
          <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center z-20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <FileText size={16} />
                <span className="text-sm font-semibold uppercase tracking-widest">Subtitle Editor</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Offset Button */}
              <button
                onClick={() => setIsOffsetModalOpen(true)}
                disabled={subtitleLines.length === 0}
                className={`flex items-center gap-2 text-xs px-3 py-2 rounded-md transition-all border ${
                  subtitleLines.length > 0
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-800/50 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                title="Shift all timestamps"
              >
                <Clock size={14} />
                <span>Shift Time</span>
              </button>

              {/* Open Subtitle Button (Replaces simple file input to support native saving) */}
              <button
                onClick={handleOpenSubtitle}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-md transition-all duration-300 font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 shadow-sm"
              >
                <FolderOpen size={14} />
                <span>{subtitleLines.length > 0 ? `${subtitleLines.length} lines` : "Open Subtitle"}</span>
              </button>

              {/* Hidden fallback input */}
              <input
                ref={subtitleInputRef}
                type="file"
                accept=".srt,.vtt"
                onChange={handleSubtitleInputChange}
                className="hidden"
              />

              {/* SAVE / DOWNLOAD LOGIC */}
              {fileHandle ? (
                // --- SCENARIO A: File Handle Available (Native Save Support) ---
                <div className="relative flex items-center">
                  {/* Main Save Button */}
                  <button
                    onClick={handleSaveSubtitles}
                    disabled={!hasUnsavedChanges}
                    className={`flex items-center gap-2 text-xs px-3 py-2 rounded-l-md transition-all duration-300 font-bold border-y border-l ${
                      hasUnsavedChanges
                        ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                    title={hasUnsavedChanges ? "Save changes to original file" : "No unsaved changes"}
                  >
                    <Save size={14} /> {hasUnsavedChanges ? 'Save' : 'Saved'}
                  </button>

                  {/* Dropdown Trigger */}
                  <button
                    onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)}
                    className={`flex items-center px-1 py-2 rounded-r-md transition-all duration-300 border-y border-r border-l-0 ${
                      hasUnsavedChanges
                        ? 'bg-indigo-700 border-indigo-500 text-white hover:bg-indigo-600'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <ChevronDown size={14} />
                  </button>

                  {/* Dropdown Menu */}
                  {isSaveMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsSaveMenuOpen(false)}></div>
                      <div className="absolute top-full right-0 mt-1 w-36 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-20 overflow-hidden">
                        <button
                          onClick={() => {
                            handleDownloadSubtitles();
                            setIsSaveMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <Download size={14} /> Save As...
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // --- SCENARIO B: No File Handle (Fallback to Download) ---
                subtitleLines.length > 0 && (
                  <button
                    onClick={handleDownloadSubtitles}
                    className={`flex items-center gap-2 text-xs px-4 py-2 rounded-md transition-all duration-300 font-bold border ${
                      hasUnsavedChanges
                        ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                    title="Download Subtitle File"
                  >
                    <Download size={14} /> Download
                  </button>
                )
              )}
            </div>
          </div>

          <div className="absolute top-12 left-0 w-full h-8 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none"></div>

          <div ref={subtitleListRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {subtitleLines.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                <AlertCircle size={32}/>
                <p>Please load a subtitle file to view dialogue.</p>
              </div>
            )}

            {subtitleLines.map(sub => {
              const isActive = sub.id === activeSubtitleId;
              return (
                <div
                  key={sub.id}
                  id={`sub-${sub.id}`}
                  className={`group flex items-center gap-4 p-3 rounded-lg transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? 'bg-slate-800 border-indigo-500/50 shadow-md transform scale-[1.01]'
                      : 'hover:bg-slate-800/50 border-transparent hover:border-slate-700'
                  } ${sub.locked ? 'opacity-80' : ''}`}
                  onClick={() => handleSubtitleClick(sub)}
                >
                  {/* Lock/Unlock Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubtitleLock(sub.id);
                    }}
                    className={`p-1.5 rounded transition-all flex-shrink-0 ${
                      sub.locked
                        ? 'text-red-400 bg-red-950/20 hover:bg-red-950/40'
                        : 'text-slate-600 opacity-0 group-hover:opacity-100 hover:text-indigo-400 hover:bg-slate-700'
                    }`}
                    title={sub.locked ? "Unlock Subtitle" : "Lock Subtitle"}
                  >
                    {sub.locked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>

                  <span className={`text-xs font-mono w-16 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                    {formatTime(sub.startTime)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <textarea
                      value={sub.text}
                      onChange={(e) => handleSubtitleTextChange(sub.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      rows={1}
                      readOnly={sub.locked}
                      className={`w-full bg-transparent resize-none focus:outline-none transition-colors border-b border-transparent py-1 ${
                        sub.locked
                          ? 'text-slate-500 cursor-not-allowed border-none'
                          : 'focus:border-indigo-500/30'
                      } ${
                        isActive ? 'text-white font-medium' : 'text-slate-400 group-hover:text-slate-300'
                      } text-lg leading-relaxed overflow-hidden`}
                      style={{ height: 'auto' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                      }}
                    />
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      createCard(sub);
                    }}
                    className={`opacity-0 group-hover:opacity-100 p-2 rounded-full transition-all flex-shrink-0
                      ${isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-700 text-slate-300 hover:bg-indigo-600 hover:text-white'
                    }`}
                    title="Create Card from this line"
                  >
                    <PlusCircle size={20}/>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none"></div>
        </div>
      </main>
    </div>
  );
};

export default App;