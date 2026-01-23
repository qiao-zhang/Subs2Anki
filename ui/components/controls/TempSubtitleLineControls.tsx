import React, {useState} from 'react';
import {Check, Clock, Download, Mic, MicOff} from 'lucide-react';
import {formatTime} from '@/core/time.ts';
import {useTranscriber} from '@/ui/hooks/useTranscriber.ts';
import {ffmpegService} from "@/core/ffmpeg.ts";
import {useAppStore} from "@/core/store.ts";

interface TempSubtitleLineControlsProps {
  start: number;
  end: number;
  onCommit: (text: string) => void;
  onTranscribe?: () => void;
  onDownloadAudio: () => void;
}

const TempSubtitleLineControls: React.FC<TempSubtitleLineControlsProps> = ({
                                                                             start,
                                                                             end,
                                                                             onCommit,
                                                                             onTranscribe,
                                                                             onDownloadAudio,
                                                                           }) => {
  const {
    videoFile
  } = useAppStore();

  const [text, setText] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>();
  const transcriber = useTranscriber();

  const handleTranscribeAudio = async () => {
    await extractAudioSync(start, end);
    if (!audioBlob) {
      return;
    }

    try {
      // Convert blob to audio buffer
      const arrayBuffer = await audioBlob.arrayBuffer();

      // Create audio context to decode the audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Start transcription
      transcriber.start(audioBuffer);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Failed to transcribe audio. Please try again.');
    }
  };

  const extractAudioSync = async (start: number, end: number) => {
    if (!videoFile) {
      setAudioBlob(null)
      return;
    }
    try {
      const blob = await ffmpegService.extractAudioClip(videoFile, start, end);
      setAudioBlob(blob);
    } catch (e) {
      console.error('Failed to extract audio clip.', e);
      setAudioBlob(null)
    }
  };

  // Handle transcription result
  React.useEffect(() => {
    if (transcriber.output && transcriber.output.text) {
      setText(transcriber.output.text);
    }
  }, [transcriber.output]);

  // Shared button styles
  const btnBase = "h-9 flex items-center justify-center gap-2 px-3 rounded-md border transition-all text-sm font-medium shadow-sm select-none";
  const btnPrimary = "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow-md shadow-emerald-900/20";
  const btnSecondary = "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600";
  const btnTranscribe = "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500";
  const kbdStyle = "hidden sm:inline-flex items-center ml-2 px-1.5 h-5 text-[10px] font-mono bg-black/20 border border-white/10 rounded text-current opacity-70 leading-none";

  return (
    <div className="flex flex-col w-full max-w-5xl gap-2 animate-in fade-in duration-200">

      <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-lg border border-slate-800">

        {/* Timestamp Info */}
        <div
          className="flex flex-col px-3 py-1 bg-slate-900 rounded border border-slate-700 min-w-[140px] text-center shrink-0 h-9 justify-center">
          <div className="flex items-center justify-center gap-2">
            <Clock size={12} className="text-slate-600"/>
            <span className="font-mono text-xs text-indigo-400">
              {formatTime(start)} - {formatTime(end)}
            </span>
            <span className="text-[10px] text-slate-600 ml-1 border-l border-slate-700 pl-2">
              {(end - start).toFixed(2)}s
            </span>
          </div>
        </div>

        {/* Input */}
        <div className="flex-1 flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-transparent border-none text-lg text-white placeholder-slate-600 focus:ring-0 focus:outline-none px-2 h-9"
            placeholder="Type subtitle text..."
            autoFocus
            disabled={transcriber.isBusy}
          />
          <button
            onClick={() => onCommit(text)}
            className={`${btnBase} ${btnPrimary}`}
            disabled={transcriber.isBusy}
          >
            <Check size={16}/>
            Add
            <kbd className={kbdStyle}>Enter</kbd>
          </button>
          <button
            onClick={handleTranscribeAudio}
            disabled={transcriber.isBusy}
            className={`${btnBase} ${!audioBlob || transcriber.isBusy ? 'bg-slate-700 border-slate-600 text-slate-500' : btnTranscribe}`}
            title="Transcribe Audio"
          >
            {transcriber.isBusy ? (
              <>
                <MicOff size={16}/> Transcribing...
              </>
            ) : (
              <>
                <Mic size={16}/> Transcribe
              </>
            )}
          </button>
          <button
            onClick={onDownloadAudio}
            className={`${btnBase} ${btnSecondary}`}
            title="Download Audio Clip"
          >
            <Download size={18}/> Clip Audio
          </button>
        </div>

      </div>

      {transcriber.isModelLoading && (
        <div className="text-xs text-slate-400 text-center mt-1">
          Loading model...
        </div>
      )}
    </div>
  );
};

export default TempSubtitleLineControls;
