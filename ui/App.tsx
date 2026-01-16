/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import React, {useState, useRef, useEffect, useCallback} from 'react';
import {SubtitleLine, AnkiCard} from '../core/types';
import {serializeSubtitles} from '../core/parser';
import {formatTime} from '../core/time';
import {generateAnkiDeck} from '../core/export';
import {ffmpegService} from '../core/ffmpeg';
import {storeMedia, deleteMedia} from '../core/db';
import {furiganaService} from '../core/furigana';
import {syncToAnki, checkConnection} from '../core/anki-connect';
import saveAs from 'file-saver';
import {VirtuosoHandle} from 'react-virtuoso';
import VideoPlayer, {VideoPlayerHandle} from './components/VideoPlayer';
import WaveformDisplay from './components/WaveformDisplay';
import DeckColumn from './components/DeckColumn';
import SubtitleColumn from './components/SubtitleColumn';
import AppControlBar from './components/AppControlBar';
import TemplateEditorModal from './components/TemplateEditorModal';
import CardPreviewModal from './components/CardPreviewModal';
import AnkiConnectSettingsModal from './components/AnkiConnectSettingsModal';
import {useAppStore} from '../core/store';
import {useMediaProcessing} from './hooks/useMediaProcessing';
import {Loader2} from 'lucide-react';

const App: React.FC = () => {
  // --- Global State from Zustand ---
  const {
    videoSrc, videoName, videoFile, setVideo,
    subtitleLines, subtitleFileName, fileHandle, setSubtitles,
    updateSubtitleText, toggleSubtitleLock, addSubtitle, removeSubtitle,
    shiftSubtitles,
    ankiCards, addCard, updateCard, deleteCard,
    ankiConfig, setAnkiConfig,
    ankiConnectUrl, setAnkiConnectUrl,
  } = useAppStore();

  // --- Local UI State (Transient) ---
  const [pauseAtTime, setPauseAtTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeSubtitleLineId, setActiveSubtitleLineId] = useState<number | null>(null);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState({current: 0, total: 0});

  // noinspection JSUnusedLocalSymbols
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);

  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isAnkiSettingsOpen, setIsAnkiSettingsOpen] = useState<boolean>(false);
  const [previewCard, setPreviewCard] = useState<AnkiCard | null>(null);

  const [tempSubtitleLine, setTempSubtitleLine] = useState<{ start: number, end: number } | null>(null);

  // Refs
  const videoRef = useRef<VideoPlayerHandle>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Reset video ready state when src changes
  useEffect(() => {
    setIsVideoReady(false);
  }, [videoSrc]);

  // --- Background Media Processing ---
  const finalizeExport = async () => {
    setIsExporting(false);
    await generateAnkiDeck(ankiCards, videoName, ankiConfig);
  };

  const finalizeSync = async () => {
    setIsSyncing(true);
    try {
      const connected = await checkConnection(ankiConnectUrl);
      if (!connected) {
        setIsSyncing(false);
        alert('Could not connect to Anki. Please check your AnkiConnect settings and ensure Anki is running.');
        setIsAnkiSettingsOpen(true);
        return;
      }

      const deckName = videoName ? `Sub2Anki::${videoName}` : 'Sub2Anki Export';
      await syncToAnki(ankiConnectUrl, deckName, ankiConfig, ankiCards, (cur, tot) => {
        setSyncProgress({current: cur, total: tot});
      });

      alert(`Successfully synced ${ankiCards.length} cards to Anki!`);
    } catch (e) {
      console.error(e);
      alert(`Sync failed: ${(e as Error).message}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress({current: 0, total: 0});
    }
  }

  // Reuse media processing hook but trigger different finalizers based on state
  // We need a ref to know which action triggered the wait
  const pendingActionRef = useRef<'export' | 'sync' | null>(null);

  const onMediaReady = () => {
    if (pendingActionRef.current === 'export') {
      finalizeExport().then();
    } else if (pendingActionRef.current === 'sync') {
      finalizeSync().then();
    }
    pendingActionRef.current = null;
  };

  useMediaProcessing(
    videoFile,
    previewCard,
    isExporting || isSyncing, // isProcessing if either active
    onMediaReady
  );

  // --- Logic Helpers ---
  const jumpToSubtitle = useCallback((direction: 'next' | 'prev') => {
    if (subtitleLines.length === 0) return;

    let nextIndex: number;
    const currentIndex = subtitleLines.findIndex(s => s.id === activeSubtitleLineId);

    if (direction === 'next') {
      if (currentIndex === -1) {
        // Find first subtitle after current time
        nextIndex = subtitleLines.findIndex(s => s.startTime > currentTime);
        if (nextIndex === -1) nextIndex = 0;
      } else {
        nextIndex = Math.min(subtitleLines.length - 1, currentIndex + 1);
      }
    } else {
      if (currentIndex === -1) {
        // Find first subtitle before current time
        const revIndex = [...subtitleLines].reverse().findIndex(s => s.startTime < currentTime);
        nextIndex = revIndex === -1 ? 0 : subtitleLines.length - 1 - revIndex;
      } else {
        nextIndex = Math.max(0, currentIndex - 1);
      }
    }

    const sub = subtitleLines[nextIndex];
    if (sub) {
      playTimeSpan(sub.startTime, sub.endTime);
    }
  }, [subtitleLines, activeSubtitleLineId, currentTime]);

  // --- Handlers ---

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideo(file);
    }
  };

  const handleTempSubtitleLineCreated = (start: number, end: number) => {
    setActiveSubtitleLineId(null);
    setTempSubtitleLine({start, end});
  };

  const handleTempSubtitleLineUpdated = (start: number, end: number) => {
    setActiveSubtitleLineId(null);
    setTempSubtitleLine({start, end});
  };

  const handleTempSubtitleLineRemoved = () => {
    setTempSubtitleLine(null);
  }

  const playTimeSpan = (start: number, end: number) => {
    if (videoRef.current === null) return;
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

  const handleCommitTempSubtitleLine = (text: string) => {
    if (!tempSubtitleLine) return;
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
      } catch (err) {
        alert('Failed to save file.');
      }
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
        const handle = await window.showSaveFilePicker({
          suggestedName: subtitleFileName,
          types: [{description: 'Subtitle File', accept: {'text/plain': [isVtt ? '.vtt' : '.srt']}}]
        });
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
    } catch (err) {
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);

    // Manual pause override (from Waveform selection or subtitle click)
    if (pauseAtTime !== null && time >= pauseAtTime) {
      videoRef.current?.pause();
      videoRef.current?.seekTo(pauseAtTime);
      setPauseAtTime(null);
      return;
    }

    // Efficiently find active subtitle index
    const activeIndex = subtitleLines.findIndex(s => time >= s.startTime && time <= s.endTime);
    const active = activeIndex !== -1 ? subtitleLines[activeIndex] : null;

    if (active && active.id !== activeSubtitleLineId) {
      setActiveSubtitleLineId(active.id);
      // Virtual Scroll to index
      virtuosoRef.current?.scrollToIndex({index: activeIndex, align: 'center', behavior: 'smooth'});
    } else if (!active) {
      setActiveSubtitleLineId(null);
    }
  };

  const handleSeek = (time: number) => {
    setPauseAtTime(null);
    videoRef.current?.seekTo(time);
  };

  const handlePlay = () => {
    if (activeSubtitleLineId !== null) {
      handlePlaySubtitleLine(activeSubtitleLineId);
      return;
    }
    if (tempSubtitleLine !== null) {
      playTimeSpan(tempSubtitleLine.start, tempSubtitleLine.end);
    }
  }

  const handlePlaySubtitleLine = (id: number) => {
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

    const cardId = crypto.randomUUID();

    // Add card with pending audio status
    const newCard: AnkiCard = {
      id: cardId,
      subtitleId: sub.id,
      text: sub.text,
      translation: '',
      notes: '',
      furigana: '', // Will be populated shortly
      screenshotRef: screenshotRef,
      audioRef: null,
      audioStatus: 'pending',
      timestampStr: formatTime(sub.startTime),
    };

    addCard(newCard);

    // Trigger Furigana Generation (async)
    furiganaService.convert(sub.text).then(f => {
      updateCard(cardId, {furigana: f});
    });
  };

  const handleDeleteCard = async (id: string) => {
    const card = ankiCards.find(c => c.id === id);
    if (card) {
      try {
        if (card.screenshotRef) await deleteMedia(card.screenshotRef);
        if (card.audioRef) await deleteMedia(card.audioRef);
      } catch (e) {
        console.error("Failed to delete media from DB", e);
      }
      deleteCard(id);
    }
  };

  const handleActionClick = (action: 'export' | 'sync') => {
    pendingActionRef.current = action;

    const pendingAudio = ankiCards.some(c => c.audioStatus === 'pending' || c.audioStatus === 'processing');

    if (pendingAudio) {
      if (action === 'export') setIsExporting(true);
      setIsExporting(true); // Using generic loading overlay
    } else {
      onMediaReady();
    }
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const dataUrl = videoRef.current.captureFrame();
    if (dataUrl) {
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const timeStr = formatTime(videoRef.current?.getCurrentTime() || 0).replace(/:/g, '-');
          saveAs(blob, `${videoName.replace(/\.[^/.]+$/, "")}_snapshot_${timeStr}.jpg`);
        });
    }
  };

  const handleDownloadAudio = async () => {
    if (!videoFile) return;
    if (tempSubtitleLine === null && activeSubtitleLineId === null) return;
    let start: number, end: number;
    if (tempSubtitleLine !== null) {
      start = tempSubtitleLine.start;
      end = tempSubtitleLine.end;
    } else {
      const currentSub = subtitleLines.find(s => s.id === activeSubtitleLineId);
      if (currentSub == null) return;
      start = currentSub.startTime;
      end = currentSub.endTime;
    }
    const blob = await extractAudioSync(start, end);

    const startStr = formatTime(start).replace(/:/g, '-');
    const endStr = formatTime(end).replace(/:/g, '-');
    const filename = `${videoName.replace(/\.[^/.]+$/, "")}_audio_${startStr}_${endStr}.wav`;

    try {
      // @ts-ignore
      if (window.showSaveFilePicker) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Audio File',
            // accept: "*.wav"
          }]
        });
        // @ts-ignore
        const writable = await handle.createWritable();
        // @ts-ignore
        await writable.write(blob);
        // @ts-ignore
        await writable.close();
      } else {
        saveAs(blob, filename);
      }
    } catch (err) {
    }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (videoRef.current?.getVideoElement()?.paused) {
            videoRef.current?.play();
          } else {
            videoRef.current?.pause();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) {
            const t = videoRef.current.getCurrentTime();
            videoRef.current.seekTo(Math.max(0, t - 5));
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) {
            const t = videoRef.current.getCurrentTime();
            videoRef.current.seekTo(t + 5);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          jumpToSubtitle('prev');
          break;
        case 'ArrowDown':
          e.preventDefault();
          jumpToSubtitle('next');
          break;
        case 'KeyR':
          e.preventDefault();
          if (activeSubtitleLineId) handlePlaySubtitleLine(activeSubtitleLineId);
          break;
        case 'KeyC':
          e.preventDefault();
          if (activeSubtitleLineId) {
            const s = subtitleLines.find(x => x.id === activeSubtitleLineId);
            if (s) handleCreateCard(s).then();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSubtitleLineId, subtitleLines, jumpToSubtitle]);


  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden relative">

      {/* Processing/Export/Sync Overlay */}
      {(isExporting || isSyncing) && (
        <div
          className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center select-none animate-in fade-in duration-300">
          <Loader2 size={48} className="text-indigo-500 animate-spin mb-4"/>
          <div className="text-xl font-bold text-white">
            {isSyncing ? `Syncing to Anki...` : "Preparing Export..."}
          </div>
          <div className="text-sm text-slate-400 mt-2">
            {isSyncing ? `Card ${syncProgress.current} of ${syncProgress.total}` :
              `Processing media ({ankiCards.filter(c => c.audioStatus !== 'done').length} remaining)`}
          </div>
          {!isSyncing && (
            <button
              onClick={() => setIsExporting(false)}
              className="mt-6 px-4 py-2 border border-slate-600 rounded text-slate-400 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Top Part: 3 Columns */}
      <div className="flex flex-1 min-h-0 w-full">

        {/* COL 1: DECK (Left) */}
        <DeckColumn
          cards={ankiCards}
          onDelete={handleDeleteCard}
          onPreview={(c) => setPreviewCard(c)}
          onOpenTemplateSettings={() => setIsTemplateModalOpen(true)}
          onExport={() => handleActionClick('export')}
          onSyncAnki={() => handleActionClick('sync')}
          onOpenAnkiSettings={() => setIsAnkiSettingsOpen(true)}
        />

        {/* COL 2: VIDEO (Center) */}
        <main className="flex-1 flex flex-col bg-slate-950 relative min-w-0">
          {/* Video Player Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 bg-black/20 min-h-0">
            <div className="w-full h-full max-w-5xl flex flex-col justify-center">
              <VideoPlayer
                ref={videoRef}
                src={videoSrc}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => setIsVideoReady(true)}
              />
            </div>
          </div>
        </main>

        {/* COL 3: SUBTITLES (Right) */}
        <SubtitleColumn
          subtitleLines={subtitleLines}
          activeSubtitleId={activeSubtitleLineId}
          subtitleFileName={subtitleFileName}
          virtuosoRef={virtuosoRef}
          canSave={fileHandle !== null}
          onSetSubtitles={setSubtitles}
          onUpdateText={updateSubtitleText}
          onPlaySubtitle={handlePlaySubtitleLine}
          onToggleLock={toggleSubtitleLock}
          onCreateCard={(sub) => {
            const s = useAppStore.getState().subtitleLines.find(x => x.id === sub.id);
            if (s) handleCreateCard(s).then();
          }}
          onSave={handleSaveSubtitles}
          onDownload={handleDownloadSubtitles}
        />
      </div>

      {/* Control Bar - Full Width with Auto Height for Editor */}
      <div
        className="min-h-20 h-auto py-2 border-t border-slate-800 bg-slate-900 flex items-center justify-center shrink-0 shadow-xl z-30 px-4 gap-4 transition-all w-full">
        <AppControlBar
          tempSubtitleLine={tempSubtitleLine}
          activeSubtitleLine={subtitleLines.find(s => s.id === activeSubtitleLineId) || null}
          videoName={videoName}
          currentTime={currentTime}
          onTempCommit={handleCommitTempSubtitleLine}
          onTempDiscard={handleTempSubtitleLineRemoved}
          onVideoUpload={handleVideoUpload}
          onPlay={handlePlay}
          onShiftSubtitles={shiftSubtitles}
          onCaptureFrame={handleCaptureFrame}
          onDownloadAudio={handleDownloadAudio}
          onUpdateSubtitleText={updateSubtitleText}
          onDeleteSubtitle={removeSubtitle}
        />
      </div>

      {/* Bottom Part: Full-width Waveform */}
      <div className="h-48 flex-shrink-0 border-t border-slate-800 bg-slate-900 z-10 w-full relative">
        <WaveformDisplay
          videoElement={videoRef.current?.getVideoElement() || null}
          videoSrc={videoSrc}
          currentTime={currentTime}
          onSeek={handleSeek}
          onTempSubtitleLineCreated={handleTempSubtitleLineCreated}
          onTempSubtitleLineUpdated={handleTempSubtitleLineUpdated}
          onTempSubtitleLineClicked={handleTempSubtitleLineClicked}
          onTempSubtitleLineRemoved={handleTempSubtitleLineRemoved}
          onPlaySubtitle={handlePlaySubtitleLine}
          onToggleLock={toggleSubtitleLock}
          onCreateCard={(id) => {
            const s = useAppStore.getState().subtitleLines.find(x => x.id === id);
            if (s) handleCreateCard(s).then();
          }}
        />
      </div>

      {/* Modals */}
      <TemplateEditorModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)}
                           config={ankiConfig} onSave={setAnkiConfig}/>
      <AnkiConnectSettingsModal isOpen={isAnkiSettingsOpen} onClose={() => setIsAnkiSettingsOpen(false)}
                                url={ankiConnectUrl} onSave={setAnkiConnectUrl}/>
      <CardPreviewModal
        isOpen={!!previewCard}
        card={previewCard ? ankiCards.find(c => c.id === previewCard.id) || previewCard : null}
        onClose={() => setPreviewCard(null)}
      />
    </div>
  );
};

export default App;
