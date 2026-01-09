
import React, {useState, useRef, useEffect, useMemo} from 'react';
import {SubtitleLine, AnkiCard, ProcessingState, AnkiNoteType} from '../core/types';
import {parseSubtitles, serializeSubtitles} from '../core/parser';
import {formatTime} from '../core/time';
import {analyzeSubtitle, LLMSettings} from '../core/gemini';
import {generateAnkiDeck} from '../core/export';
import {loadAudioBuffer, sliceAudioBuffer} from '../core/media-utils';
import saveAs from 'file-saver';
import VideoPlayer, {VideoPlayerHandle} from './components/VideoPlayer';
import WaveformDisplay from './components/WaveformDisplay';
import CardItem from './components/CardItem';
import TemplateEditorModal from './components/TemplateEditorModal';
import NewSubtitleModal from './components/NewSubtitleModal';
import LLMSettingsModal from './components/LLMSettingsModal';
import {
  FileText,
  Download,
  PlusCircle,
  Layers,
  AlertCircle,
  Video as VideoIcon,
  Save,
  FolderOpen,
  Lock,
  Unlock,
  Settings,
  Bot,
} from 'lucide-react';

const DEFAULT_NOTE_TYPE: AnkiNoteType = {
  id: 123456789,
  name: "Sub2Anki Advanced",
  css: `.card { font-family:Arial; font-size:36px; text-align: center; color:black; background-color:white; } .before{ font-size: 18px; text-align: left; color: grey; } .after { font-size: 18px; text-align: left; color: grey; } .tags { font-size:15px; text-align: left; color:grey; } .notes { font-size:21px; text-align: left; color:grey; }`,
  fields: [
    { name: "Sequence", source: 'Sequence' },
    { name: "Before" },
    { name: "BeforeAudio" },
    { name: "CurrentFront", source: 'Text' },
    { name: "CurrentBack", source: 'Text' },
    { name: "Audio", source: 'Audio' },
    { name: "After" },
    { name: "AfterAudio" },
    { name: "Meaning", source: 'Translation' },
    { name: "Media", source: 'Image' },
    { name: "Notes", source: 'Notes' }
  ],
  templates: [{
    Name: "Card 1",
    Front: `{{#Tags}}<div class="tags"><span>🏷️</span> {{Tags}}</div>{{/Tags}}<span class='media'>{{Media}}</span></br>{{#Before}}<div class="before"><span>⬅️</span> {{furigana:Before}}<span id="before-audio">{{BeforeAudio}}</span></div>{{/Before}}<div class='expression'>{{furigana:CurrentFront}}</div>{{#After}}<div class="after"><span>➡️</span> {{furigana:After}}</div>{{/After}}<script>var title = document.getElementById("before-audio"); if (title) { var button = title.querySelector(".replay-button.soundLink"); if (button) button.click(); }</script>`,
    Back: `{{#Tags}}<div class="tags"><span>🏷️</span> {{Tags}}</div>{{/Tags}}<span class='media'>{{Media}}</span></br>{{#Before}}<div class="before"><span>⬅️</span> {{furigana:Before}}<span id="before-audio">{{BeforeAudio}}</span></div>{{/Before}}<div class='reading'>{{furigana:CurrentBack}}<span id="current-audio">{{Audio}}</span></div><div class='meaning'>{{Meaning}}</div>{{#After}}<div class="after"><span>➡️</span> {{furigana:After}}<span id="after-audio">{{AfterAudio}}</span></div>{{/After}}<br><div class='notes'>{{Notes}}</div><script>var title = document.getElementById("current-audio"); if (title) { var button = title.querySelector(".replay-button.soundLink"); if (button) button.click(); }</script>`
  }]
};

const App: React.FC = () => {
  // --- State Management ---
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [videoName, setVideoName] = useState<string>('');
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  
  const [subtitleLines, setSubtitleLines] = useState<SubtitleLine[]>([]);
  const [subtitleFileName, setSubtitleFileName] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [fileHandle, setFileHandle] = useState<any>(null);

  const [pauseAtTime, setPauseAtTime] = useState<number | null>(null);

  const [isNewSubtitleModalOpen, setIsNewSubtitleModalOpen] = useState<boolean>(false);
  const [newSubtitleTimes, setNewSubtitleTimes] = useState<{start: number, end: number}>({start: 0, end: 0});
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [subAudioBlob, setSubAudioBlob] = useState<Blob | null>(null);

  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [ankiConfig, setAnkiConfig] = useState<AnkiNoteType>(DEFAULT_NOTE_TYPE);

  const [isLLMSettingsOpen, setIsLLMSettingsOpen] = useState<boolean>(false);
  const [llmSettings, setLlmSettings] = useState<LLMSettings>({
    provider: 'gemini',
    apiKey: process.env.API_KEY || '',
    model: 'gemini-2.5-flash',
    autoAnalyze: false
  });

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeSubtitleId, setActiveSubtitleId] = useState<number | null>(null);
  const [ankiCards, setAnkiCards] = useState<AnkiCard[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({ isAnalyzing: false, progress: 0, total: 0 });

  const videoRef = useRef<VideoPlayerHandle>(null);
  const subtitleListRef = useRef<HTMLDivElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sub2anki_llm_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.apiKey && parsed.provider === 'gemini') {
            parsed.apiKey = process.env.API_KEY || '';
        }
        setLlmSettings(parsed);
      } catch (e) { console.error("Failed to load settings", e); }
    }
  }, []);

  const handleSaveLLMSettings = (newSettings: LLMSettings) => {
    setLlmSettings(newSettings);
    localStorage.setItem('sub2anki_llm_settings', JSON.stringify(newSettings));
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoName(file.name);
      setAudioBuffer(null);
    }
  };

  useEffect(() => {
    if (videoSrc) {
       loadAudioBuffer(videoSrc).then(setAudioBuffer).catch(err => console.error("Failed to load audio track", err));
    }
  }, [videoSrc]);

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
        setSubtitleFileName(file.name);
        setSubtitleLines(parseSubtitles(text));
        setFileHandle(handle);
        setHasUnsavedChanges(false);
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
      setSubtitleFileName(file.name);
      setFileHandle(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSubtitleLines(parseSubtitles(e.target?.result as string));
        setHasUnsavedChanges(false);
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const handleSubtitleTextChange = (id: number, newText: string) => {
    setSubtitleLines(prev => prev.map(s => (s.id === id && !s.locked) ? { ...s, text: newText } : s));
    setHasUnsavedChanges(true);
  };

  const handleSubtitleTimeChange = (id: number, start: number, end: number) => {
    setSubtitleLines(prev => prev.map(s => (s.id === id && !s.locked) ? { ...s, startTime: start, endTime: end } : s));
    setHasUnsavedChanges(true);
  };

  const handleNewSegment = (start: number, end: number) => {
    videoRef.current?.pause();
    setEditingSubId(null);
    setNewSubtitleTimes({ start, end });
    if (audioBuffer) setSubAudioBlob(sliceAudioBuffer(audioBuffer, start, end));
    setIsNewSubtitleModalOpen(true);
  };

  const handleEditSubtitle = (id: number) => {
    const sub = subtitleLines.find(s => s.id === id);
    if (!sub) return;
    videoRef.current?.pause();
    setEditingSubId(id);
    setNewSubtitleTimes({ start: sub.startTime, end: sub.endTime });
    if (audioBuffer) setSubAudioBlob(sliceAudioBuffer(audioBuffer, sub.startTime, sub.endTime));
    setIsNewSubtitleModalOpen(true);
  };

  const handleSaveSubtitleFromModal = (text: string) => {
    if (editingSubId !== null) {
      setSubtitleLines(prev => prev.map(s => s.id === editingSubId ? { ...s, text } : s));
    } else {
      const maxId = subtitleLines.reduce((max, s) => Math.max(max, s.id), 0);
      const newSub: SubtitleLine = { id: maxId + 1, startTime: newSubtitleTimes.start, endTime: newSubtitleTimes.end, text, locked: false };
      setSubtitleLines(prev => [...prev, newSub].sort((a, b) => a.startTime - b.startTime));
    }
    setHasUnsavedChanges(true);
  };

  const toggleSubtitleLock = (id: number) => {
    setSubtitleLines(prev => prev.map(s => s.id === id ? { ...s, locked: !s.locked } : s));
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
        setHasUnsavedChanges(false);
      } catch (err) { alert('Failed to save file.'); }
    } else { setHasUnsavedChanges(false); }
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
        setHasUnsavedChanges(false);
      }
    } catch (err) {}
    setIsSaveMenuOpen(false);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    if (pauseAtTime !== null && time >= pauseAtTime) {
      videoRef.current?.pause();
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
    const sub = subtitleLines.find(s => s.id === id);
    if (sub && videoRef.current) {
        setPauseAtTime(sub.endTime);
        videoRef.current.seekTo(sub.startTime);
        videoRef.current.play();
    }
  };

  const createCard = async (sub: SubtitleLine) => {
    if (!videoRef.current) return;
    let audioBlob: Blob | null = null;
    if (audioBuffer) audioBlob = sliceAudioBuffer(audioBuffer, sub.startTime, sub.endTime);
    setPauseAtTime(null);
    const screenshot = await videoRef.current.captureFrameAt(sub.startTime);
    const newCard: AnkiCard = { id: crypto.randomUUID(), subtitleId: sub.id, text: sub.text, translation: '', notes: '', screenshotDataUrl: screenshot || null, audioBlob: audioBlob, timestampStr: formatTime(sub.startTime) };
    setAnkiCards(prev => [newCard, ...prev]);
    if (llmSettings.autoAnalyze) analyzeCard(newCard);
  };

  const analyzeCard = async (card: AnkiCard) => {
    setProcessing(prev => ({...prev, isAnalyzing: true}));
    const subIndex = subtitleLines.findIndex(s => s.id === card.subtitleId);
    const result = await analyzeSubtitle(card.text, subtitleLines[subIndex - 1]?.text, subtitleLines[subIndex + 1]?.text, llmSettings);
    setAnkiCards(prev => prev.map(c => c.id === card.id ? { ...c, translation: result.translation, notes: `${result.notes} \nVocab: ${result.keyWords.join(', ')}` } : c));
    setProcessing(prev => ({...prev, isAnalyzing: false}));
  };

  const deleteCard = (id: string) => setAnkiCards(prev => prev.filter(c => c.id !== id));
  const handleExport = async () => await generateAnkiDeck(ankiCards, videoName, ankiConfig);

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
            {ankiCards.length === 0 ? <div className="text-center py-10 text-slate-600 text-xs">No cards yet</div> : ankiCards.map(card => <CardItem key={card.id} card={card} onDelete={deleteCard} onAnalyze={analyzeCard} isAnalyzing={processing.isAnalyzing} />)}
          </div>
        </aside>

        {/* COL 2: VIDEO & CONTROLS (Center) */}
        <main className="flex-1 flex flex-col bg-slate-950 relative min-w-0">
          {/* Video Player Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 bg-black/20 min-h-0">
             <div className="w-full h-full max-w-5xl flex flex-col justify-center">
                <VideoPlayer ref={videoRef} src={videoSrc} onTimeUpdate={handleTimeUpdate} />
             </div>
          </div>

          {/* Component Island (Control Bar) */}
          <div className="h-16 border-t border-slate-800 bg-slate-900 flex items-center justify-center shrink-0 shadow-xl z-30 px-4 gap-4">
             
             {/* Video Selector */}
             <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition text-sm font-medium text-slate-300 border border-slate-700">
                <VideoIcon size={16}/><span className="truncate max-w-[200px]">{videoName || "Select Video File"}</span>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden"/>
             </label>

             <div className="h-8 w-px bg-slate-800"></div>

             {/* Time Display */}
             <div className="font-mono text-xl text-indigo-400 font-bold tracking-widest min-w-[100px] text-center">
                {formatTime(currentTime)}
             </div>

             <div className="h-8 w-px bg-slate-800"></div>

             {/* AI Settings */}
             <button onClick={() => setIsLLMSettingsOpen(true)} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition border ${llmSettings.apiKey ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-red-900/20 border-red-800/50 text-red-400'}`}>
                <Bot size={16} /> <span>{llmSettings.model.split('-')[1]?.toUpperCase() || "AI"}</span>
             </button>

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
                    <textarea value={sub.text} onChange={(e) => handleSubtitleTextChange(sub.id, e.target.value)} onClick={(e) => e.stopPropagation()} rows={2} readOnly={sub.locked} className={`w-full bg-transparent resize-none outline-none text-sm leading-snug ${sub.locked ? 'text-slate-500' : isActive ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}/>
                  </div>
                  <button onClick={(e) => {e.stopPropagation(); createCard(sub);}} className={`mt-1 text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition`} title="Create Card"><PlusCircle size={16}/></button>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* Bottom Part: Full-width Waveform */}
      <div className="h-48 flex-shrink-0 border-t border-slate-800 bg-slate-900 z-10 w-full relative">
        <WaveformDisplay 
          audioSrc={videoSrc} 
          currentTime={currentTime} 
          onSeek={handleSeek} 
          subtitles={subtitleLines} 
          onSubtitleChange={handleSubtitleTimeChange} 
          onNewSegment={handleNewSegment}
          onEditSubtitle={handleEditSubtitle}
          onPlaySubtitle={handlePlaySubtitle}
          onToggleLock={toggleSubtitleLock}
          onCreateCard={(id) => { const s = subtitleLines.find(x => x.id === id); if(s) createCard(s); }}
        />
      </div>

      {/* Modals */}
      <TemplateEditorModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} config={ankiConfig} onSave={setAnkiConfig} />
      <LLMSettingsModal isOpen={isLLMSettingsOpen} onClose={() => setIsLLMSettingsOpen(false)} settings={llmSettings} onSave={handleSaveLLMSettings} />
      <NewSubtitleModal 
        isOpen={isNewSubtitleModalOpen} 
        onClose={() => setIsNewSubtitleModalOpen(false)} 
        startTime={newSubtitleTimes.start} 
        endTime={newSubtitleTimes.end} 
        initialText={editingSubId !== null ? subtitleLines.find(s => s.id === editingSubId)?.text : ''}
        audioBlob={subAudioBlob} 
        llmSettings={llmSettings} 
        onSave={handleSaveSubtitleFromModal} 
      />
    </div>
  );
};

export default App;
