
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import React, {useState, useRef} from 'react';
import {SubtitleLine, AnkiCard} from '../core/types';
import {serializeSubtitles} from '../core/parser';
import {formatTime} from '../core/time';
import {analyzeSubtitle} from '../core/gemini';
import {generateAnkiDeck} from '../core/export';
import {ffmpegService} from '../core/ffmpeg';
import {storeMedia, deleteMedia} from '../core/db';
import saveAs from 'file-saver';
import { VirtuosoHandle } from 'react-virtuoso';
import VideoPlayer, {VideoPlayerHandle} from './components/VideoPlayer';
import WaveformDisplay from './components/WaveformDisplay';
import DeckColumn from './components/DeckColumn';
import SubtitleColumn from './components/SubtitleColumn';
import AppControlBar from './components/AppControlBar';
import TemplateEditorModal from './components/TemplateEditorModal';
import EditSubtitleLineModal from './components/EditSubtitleLineModal';
import LLMSettingsModal from './components/LLMSettingsModal';
import CardPreviewModal from './components/CardPreviewModal';
import { useAppStore } from '../core/store';
import { useMediaProcessing } from './hooks/useMediaProcessing';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // --- Global State from Zustand ---
  const {
    videoSrc, videoName, videoFile, setVideo,
    subtitleLines, subtitleFileName, fileHandle, setSubtitles,
    updateSubtitleText, toggleSubtitleLock, addSubtitle, removeSubtitle,
    shiftSubtitles,
    ankiCards, addCard, updateCard, deleteCard,
    ankiConfig, setAnkiConfig,
    llmSettings, setLLMSettings,
    processing, setProcessing
  } = useAppStore();

  // --- Local UI State (Transient) ---
  const [pauseAtTime, setPauseAtTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeSubtitleId, setActiveSubtitleId] = useState<number | null>(null);

  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Modals
  const [isNewSubtitleModalOpen, setIsNewSubtitleModalOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isLLMSettingsOpen, setIsLLMSettingsOpen] = useState<boolean>(false);
  const [previewCard, setPreviewCard] = useState<AnkiCard | null>(null);

  // Editing context
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [subAudioBlob, setSubAudioBlob] = useState<Blob | null>(null);

  const [tempSubtitleLine, setTempSubtitleLine] = useState<{start: number, end: number} | null>(null);

  // Refs
  const videoRef = useRef<VideoPlayerHandle>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // --- Background Media Processing ---
  const finalizeExport = async () => {
    setIsExporting(false);
    await generateAnkiDeck(ankiCards, videoName, ankiConfig);
  };

  useMediaProcessing(videoFile, previewCard, isExporting, finalizeExport);

  // --- Handlers ---

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideo(file);
    }
  };

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

  const extractAudioSync = async (start: number, end: number): Promise<Blob | null> => {
    if (!videoFile) return null;
    try {
      videoRef.current?.pause();
      return await ffmpegService.extractAudioClip(videoFile, start, end);
    } catch (e) {
      console.error("Audio extraction failed", e);
      return null;
    }
  };

  const handleCommitTempSubtitleLine = async () => {
    if (!tempSubtitleLine) return;
    const blob = await extractAudioSync(tempSubtitleLine.start, tempSubtitleLine.end);
    setSubAudioBlob(blob);
    setIsNewSubtitleModalOpen(true);
  };

  const handleEditSubtitle = async (id: number) => {
    const sub = useAppStore.getState().subtitleLines.find(s => s.id === id);
    if (!sub) return;

    videoRef.current?.pause();
    videoRef.current?.seekTo(sub.startTime);

    const blob = await extractAudioSync(sub.startTime, sub.endTime);

    setEditingSubId(id);
    setTempSubtitleLine(null);
    setSubAudioBlob(blob);
    setIsNewSubtitleModalOpen(true);
  };

  const handleSaveSubtitleFromModal = (text: string) => {
    if (editingSubId !== null) {
      updateSubtitleText(editingSubId, text);
    } else if (tempSubtitleLine) {
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
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    if (pauseAtTime !== null && time >= pauseAtTime) {
      videoRef.current?.pause();
      videoRef.current?.seekTo(pauseAtTime);
      setPauseAtTime(null);
    }

    // Efficiently find active subtitle index
    const activeIndex = subtitleLines.findIndex(s => time >= s.startTime && time <= s.endTime);
    const active = activeIndex !== -1 ? subtitleLines[activeIndex] : null;

    if (active && active.id !== activeSubtitleId) {
      setActiveSubtitleId(active.id);
      // Virtual Scroll to index
      virtuosoRef.current?.scrollToIndex({ index: activeIndex, align: 'center', behavior: 'smooth' });
    } else if (!active) {
      setActiveSubtitleId(null);
    }
  };

  const handleSeek = (time: number) => {
    setPauseAtTime(null);
    videoRef.current?.seekTo(time);
  };

  const handlePlaySubtitle = (id: number) => {
    const sub = useAppStore.getState().subtitleLines.find(s => s.id === id);
    if (sub && videoRef.current) {
      setTempSubtitleLine(null);
      playTimeSpan(sub.startTime, sub.endTime);
    }
  };

  const handleCreateCard = async (sub: SubtitleLine) => {
    if (!videoRef.current) return;

    // Capture Screenshot immediately
    const screenshot = await videoRef.current.captureFrameAt(sub.startTime);
    setPauseAtTime(null);

    let screenshotRef = null;
    if (screenshot) {
      screenshotRef = crypto.randomUUID();
      await storeMedia(screenshotRef, screenshot);
    }

    // Add card with pending audio status
    const newCard: AnkiCard = {
      id: crypto.randomUUID(),
      subtitleId: sub.id,
      text: sub.text,
      translation: '',
      notes: '',
      screenshotRef: screenshotRef,
      audioRef: null,
      audioStatus: 'pending',
      timestampStr: formatTime(sub.startTime),
      preferredMediaType: 'image',
      gifStatus: undefined,
      gifRef: null
    };

    addCard(newCard);

    if (llmSettings.autoAnalyze) handleAnalyzeCard(newCard);
  };

  const handleAnalyzeCard = async (card: AnkiCard) => {
    setProcessing({ isAnalyzing: true });

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

  const handleDeleteCard = async (id: string) => {
    const card = ankiCards.find(c => c.id === id);
    if (card) {
      try {
        if (card.screenshotRef) await deleteMedia(card.screenshotRef);
        if (card.audioRef) await deleteMedia(card.audioRef);
        if (card.gifRef) await deleteMedia(card.gifRef);
      } catch (e) {
        console.error("Failed to delete media from DB", e);
      }
      deleteCard(id);
    }
  };

  const handleExportClick = () => {
    // Check if audio processing is pending
    const pendingAudio = ankiCards.some(c => c.audioStatus === 'pending' || c.audioStatus === 'processing');
    const pendingGif = ankiCards.some(c => c.gifStatus === 'pending' || c.gifStatus === 'processing');

    if (pendingAudio || pendingGif) {
      setIsExporting(true);
    } else {
      finalizeExport();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden relative">

      {/* Export Wait Overlay */}
      {isExporting && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center select-none animate-in fade-in duration-300">
          <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
          <div className="text-xl font-bold text-white">Finalizing Export...</div>
          <div className="text-sm text-slate-400 mt-2">
            Processing media ({ankiCards.filter(c => c.audioStatus !== 'done' || (c.preferredMediaType === 'gif' && c.gifStatus !== 'done')).length} remaining)
          </div>
          <button
            onClick={() => setIsExporting(false)}
            className="mt-6 px-4 py-2 border border-slate-600 rounded text-slate-400 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Top Part: 3 Columns */}
      <div className="flex flex-1 min-h-0 w-full">

        {/* COL 1: DECK (Left) */}
        <DeckColumn
          cards={ankiCards}
          isAnalyzing={processing.isAnalyzing}
          onDelete={handleDeleteCard}
          onAnalyze={handleAnalyzeCard}
          onPreview={(c) => setPreviewCard(c)}
          onOpenTemplateSettings={() => setIsTemplateModalOpen(true)}
          onExport={handleExportClick}
        />

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
        <SubtitleColumn
          subtitleLines={subtitleLines}
          activeSubtitleId={activeSubtitleId}
          subtitleFileName={subtitleFileName}
          virtuosoRef={virtuosoRef}
          onSetSubtitles={setSubtitles}
          onUpdateText={updateSubtitleText}
          onPlaySubtitle={handlePlaySubtitle}
          onToggleLock={toggleSubtitleLock}
          onCreateCard={(sub) => {
            const s = useAppStore.getState().subtitleLines.find(x => x.id === sub.id);
            if(s) handleCreateCard(s);
          }}
          onSave={handleSaveSubtitles}
          onDownload={handleDownloadSubtitles}
          onShiftSubtitles={shiftSubtitles}
        />
      </div>

      {/* Control Bar - Full Width */}
      <div className="h-16 border-t border-slate-800 bg-slate-900 flex items-center justify-center shrink-0 shadow-xl z-30 px-4 gap-4 transition-all w-full">
        <AppControlBar
          tempSubtitleLine={tempSubtitleLine}
          activeSubtitleId={activeSubtitleId}
          videoName={videoName}
          currentTime={currentTime}
          llmSettings={llmSettings}
          onTempPlay={handleTempSubtitleLineClicked}
          onTempCommit={handleCommitTempSubtitleLine}
          onTempDiscard={handleTempSubtitleLineRemoved}
          onVideoUpload={handleVideoUpload}
          onOpenLLMSettings={() => setIsLLMSettingsOpen(true)}
          onReplayActive={() => {
            if (activeSubtitleId) handlePlaySubtitle(activeSubtitleId);
          }}
        />
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
      <CardPreviewModal
        isOpen={!!previewCard}
        card={previewCard ? ankiCards.find(c => c.id === previewCard.id) || previewCard : null}
        onClose={() => setPreviewCard(null)}
      />
      <EditSubtitleLineModal
        isOpen={isNewSubtitleModalOpen}
        onRemove={handleRemoveBtnClicked}
        onClose={() => setIsNewSubtitleModalOpen(false)}
        startTime={tempSubtitleLine ? tempSubtitleLine.start : (editingSubId ? (subtitleLines.find(s => s.id === editingSubId)?.startTime || 0) : 0)}
        endTime={tempSubtitleLine ? tempSubtitleLine.end : (editingSubId ? (subtitleLines.find(s => s.id === editingSubId)?.endTime || 0) : 0)}
        initialText={editingSubId !== null ? subtitleLines.find(s => s.id === editingSubId)?.text : ''}
        audioBlob={subAudioBlob}
        llmSettings={llmSettings}
        onSave={handleSaveSubtitleFromModal}
      />
    </div>
  );
};

export default App;
