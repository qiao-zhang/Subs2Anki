import React, {useState, useRef, useMemo} from 'react';
import {SubtitleLine, AnkiCard, ProcessingState} from '../core/types';
import {parseSubtitles} from '../core/parser';
import {formatTime} from '../core/time';
import {analyzeSubtitle} from '../core/gemini';
import {generateAnkiDeck} from '../core/export';
import VideoPlayer, {VideoPlayerHandle} from './components/VideoPlayer';
import WaveformDisplay from './components/WaveformDisplay';
import CardItem from './components/CardItem';
import {
  FileText,
  Download,
  PlusCircle,
  Layers,
  AlertCircle,
  Video as VideoIcon,
  Clock,
  Save,
  Upload,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Offset Modal State
  const [isOffsetModalOpen, setIsOffsetModalOpen] = useState<boolean>(false);
  const [tempOffsetMs, setTempOffsetMs] = useState<number>(0);

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

  const handleSubtitleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const parsed = parseSubtitles(content);
        setSubtitleLines(parsed);
        setHasUnsavedChanges(false);
      };
      reader.readAsText(file);
    }
  };

  const handleSubtitleTextChange = (id: number, newText: string) => {
    setSubtitleLines((prev: SubtitleLine[]) => prev.map((s: SubtitleLine) => s.id === id ? { ...s, text: newText } : s));
    setHasUnsavedChanges(true);
  };

  /**
   * Applies the time offset to all subtitles in the baseline state.
   */
  const applyOffset = () => {
    const offsetSec = tempOffsetMs / 1000;
    setSubtitleLines((prev: SubtitleLine[]) => prev.map(s => ({
      ...s,
      startTime: Math.max(0, s.startTime + offsetSec),
      endTime: Math.max(0, s.endTime + offsetSec)
    })));
    setHasUnsavedChanges(true);
    setIsOffsetModalOpen(false);
    setTempOffsetMs(0); // Reset for next use
  };

  const handleSaveSubtitles = () => {
    setHasUnsavedChanges(false);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
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
    if (videoRef.current) {
      videoRef.current.seekTo(time);
    }
  };

  const handleSubtitleClick = (sub: SubtitleLine) => {
    // Even if hidden, the video player exists in DOM, so we can control it.
    if (videoRef.current) {
      videoRef.current.seekTo(sub.startTime);
      videoRef.current.play();
    }
  };

  const createCard = (sub: SubtitleLine) => {
    // Since video is in DOM, captureFrame works even if the video player is hidden (in most modern browsers).
    if (!videoRef.current) return;
    videoRef.current.pause();
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
    await generateAnkiDeck(ankiCards, videoName);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200">

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
            {ankiCards.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full transition"
              >
                <Download size={14}/> Export
              </button>
            )}
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

              {/* Subtitle Upload Button */}
              <label className="flex items-center gap-2 text-xs px-4 py-2 rounded-md transition-all duration-300 font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer shadow-sm">
                <Upload size={14} />
                <span>{subtitleLines.length > 0 ? `${subtitleLines.length} lines` : "Select Subtitle"}</span>
                <input type="file" accept=".srt,.vtt" onChange={handleSubtitleUpload} className="hidden" />
              </label>

              {/* Save Button */}
              <button
                onClick={handleSaveSubtitles}
                disabled={!hasUnsavedChanges}
                className={`flex items-center gap-2 text-xs px-4 py-2 rounded-md transition-all duration-300 font-bold border ${
                  hasUnsavedChanges
                    ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Save size={14} /> {hasUnsavedChanges ? 'Save Changes' : 'All Saved'}
              </button>
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
                  }`}
                  onClick={() => handleSubtitleClick(sub)}
                >
                  <span className={`text-xs font-mono w-16 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                    {formatTime(sub.startTime)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <textarea
                      value={sub.text}
                      onChange={(e) => handleSubtitleTextChange(sub.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      rows={1}
                      className={`w-full bg-transparent resize-none focus:outline-none transition-colors border-b border-transparent focus:border-indigo-500/30 py-1 ${
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