import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Subtitle, AnkiCard, ProcessingState } from './types';
import { parseSubtitles } from './utils/srtParser';
import { formatTime } from './utils/time';
import VideoPlayer, { VideoPlayerHandle } from './components/VideoPlayer';
import CardItem from './components/CardItem';
import { analyzeSubtitle } from './services/gemini';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { 
  Upload, 
  FileText, 
  Download, 
  PlusCircle, 
  Layers, 
  AlertCircle,
  Video as VideoIcon
} from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [videoName, setVideoName] = useState<string>('');
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [cards, setCards] = useState<AnkiCard[]>([]);
  const [activeSubtitleId, setActiveSubtitleId] = useState<number | null>(null);
  
  // AI Processing State
  const [processing, setProcessing] = useState<ProcessingState>({
    isAnalyzing: false,
    progress: 0,
    total: 0
  });

  // Refs
  const videoRef = useRef<VideoPlayerHandle>(null);
  const subtitleListRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoName(file.name);
    }
  };

  const handleSubtitleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const parsed = parseSubtitles(content);
        setSubtitles(parsed);
      };
      reader.readAsText(file);
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    // Find active subtitle
    const active = subtitles.find(s => time >= s.startTime && time <= s.endTime);
    if (active && active.id !== activeSubtitleId) {
      setActiveSubtitleId(active.id);
      // Auto-scroll logic could go here
      const el = document.getElementById(`sub-${active.id}`);
      if (el && subtitleListRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (!active) {
      setActiveSubtitleId(null);
    }
  };

  const handleSubtitleClick = (sub: Subtitle) => {
    if (videoRef.current) {
      videoRef.current.seekTo(sub.startTime);
      videoRef.current.play();
    }
  };

  const createCard = (sub: Subtitle) => {
    if (!videoRef.current) return;
    
    // Pause to ensure clean capture
    videoRef.current.pause();
    videoRef.current.seekTo(sub.startTime + (sub.endTime - sub.startTime) / 2); // Seek to middle for better screenshot context usually
    
    // Allow a split second for seek to render frame
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

        setCards(prev => [newCard, ...prev]);
    }, 200);
  };

  const analyzeCard = async (card: AnkiCard) => {
    setProcessing(prev => ({ ...prev, isAnalyzing: true }));
    
    // Find context
    const subIndex = subtitles.findIndex(s => s.id === card.subtitleId);
    const prevText = subtitles[subIndex - 1]?.text || "";
    const nextText = subtitles[subIndex + 1]?.text || "";

    const result = await analyzeSubtitle(card.text, prevText, nextText);

    setCards(prev => prev.map(c => {
      if (c.id === card.id) {
        return {
          ...c,
          translation: result.translation,
          notes: `${result.notes} \nVocab: ${result.keyWords.join(', ')}`
        };
      }
      return c;
    }));

    setProcessing(prev => ({ ...prev, isAnalyzing: false }));
  };

  const deleteCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const exportDeck = async () => {
    if (cards.length === 0) return;

    const zip = new JSZip();
    const mediaFolder = zip.folder("media");
    let csvContent = "# separator:Tab\n# html:true\n# tags:Sub2AnkiAI\n";

    cards.forEach((card, index) => {
        const safeFilename = `image_${index}_${Date.now()}.jpg`;
        
        // Add image to zip
        if (card.screenshotDataUrl) {
            const base64Data = card.screenshotDataUrl.split(',')[1];
            mediaFolder?.file(safeFilename, base64Data, { base64: true });
        }

        // CSV Format: Text [TAB] Translation <br> Notes [TAB] <img src="..."> [TAB] [Sound:...]
        const front = card.text.replace(/\t/g, ' '); // sanitize tabs
        const back = `<b>${card.translation}</b><br><br><small>${card.notes.replace(/\n/g, '<br>')}</small>`;
        const media = `<img src="${safeFilename}">`;
        
        csvContent += `${front}\t${back}\t${media}\n`;
    });

    zip.file("import.txt", csvContent);
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `AnkiDeck-${videoName || 'export'}.zip`);
  };

  // --- Render ---

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200">
      
      {/* Left Sidebar: Controls & Card List */}
      <aside className="w-96 flex flex-col border-r border-slate-800 bg-slate-900/50">
        <div className="p-4 border-b border-slate-800">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2 mb-4">
                <Layers className="text-indigo-500" /> Sub2Anki AI
            </h1>
            
            <div className="space-y-3">
                <label className="flex items-center gap-2 w-full p-2 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer transition text-sm">
                    <VideoIcon size={16} />
                    <span className="truncate">{videoName || "Select Video File"}</span>
                    <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>

                <label className="flex items-center gap-2 w-full p-2 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer transition text-sm">
                    <FileText size={16} />
                    <span>{subtitles.length > 0 ? `${subtitles.length} lines loaded` : "Select Subtitle (.srt/.vtt)"}</span>
                    <input type="file" accept=".srt,.vtt" onChange={handleSubtitleUpload} className="hidden" />
                </label>
            </div>
        </div>

        {/* Deck / Cards Area */}
        <div className="flex-1 overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-slate-300">Your Deck ({cards.length})</h2>
                {cards.length > 0 && (
                     <button 
                     onClick={exportDeck}
                     className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full transition"
                 >
                     <Download size={14} /> Export
                 </button>
                )}
            </div>
            
            {cards.length === 0 ? (
                <div className="text-center py-10 text-slate-600">
                    <p className="mb-2">No cards created yet.</p>
                    <p className="text-xs">Load a video and subtitles, then click the (+) button on a line to start.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {cards.map(card => (
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
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top: Video Player */}
        <div className="p-4 bg-black/20 border-b border-slate-800 flex justify-center">
            <div className="w-full max-w-4xl">
                <VideoPlayer 
                    ref={videoRef} 
                    src={videoSrc} 
                    onTimeUpdate={handleTimeUpdate} 
                />
            </div>
        </div>

        {/* Bottom: Subtitle List */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-900">
             <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none"></div>
             
             <div ref={subtitleListRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                {subtitles.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                        <AlertCircle size={32} />
                        <p>Please load a subtitle file to view dialogue.</p>
                    </div>
                )}
                {subtitles.map(sub => {
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
                            
                            <p className={`flex-1 text-lg leading-relaxed ${isActive ? 'text-white font-medium' : 'text-slate-400'}`}>
                                {sub.text}
                            </p>

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
                                <PlusCircle size={20} />
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