/// <reference lib="dom" />
import React, {useState, useEffect, useRef} from 'react';
import {X, Save, Clock, Mic, MicOff} from 'lucide-react';
import {formatTime} from '@/core/time.ts';
import {useTranscriber} from '@/ui/hooks/useTranscriber.ts';

interface EditSubtitleLineModalProps {
  isOpen: boolean;
  startTime: number;
  endTime: number;
  onRemove: () => void;
  onClose: () => void;
  onSave: (text: string) => void;
  initialText?: string;
  audioBlob?: Blob | null;
}

const EditSubtitleLineModal: React.FC<EditSubtitleLineModalProps> = (
  {
    isOpen,
    startTime,
    endTime,
    onRemove,
    onClose,
    onSave,
    initialText = '',
    audioBlob,
  }) => {
  const [text, setText] = useState(initialText);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const transcriber = useTranscriber();

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      // Focus input after a short delay to allow animation
      setTimeout(() => {
        inputRef.current?.focus();
        // Optionally select all text if editing
        if (initialText) inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, initialText]);

  // Handle transcription result
  useEffect(() => {
    if (transcriber.output && transcriber.output.text) {
      setText(transcriber.output.text);
    }
  }, [transcriber.output]);

  if (!isOpen) return null;

  const handleRemove = () => {
    onRemove();
    onClose();
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(text);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // TODO Enter + ShiftKey to submit
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleTranscribeAudio = async () => {
    extractdd
    if (!audioBlob) {
      alert('No audio available for this subtitle line');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Clock className="text-indigo-400" size={20}/> {initialText ? 'Edit Subtitle' : 'New Subtitle Line'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div
            className="flex items-center justify-between text-xs text-slate-400 bg-slate-800/50 p-2 rounded border border-slate-700">
            <div>
              <span className="font-bold uppercase mr-2">Start:</span>
              <span className="font-mono text-indigo-300">{formatTime(startTime)}</span>
            </div>
            <div className="h-4 w-px bg-slate-600"></div>
            <div>
              <span className="font-bold uppercase mr-2">End:</span>
              <span className="font-mono text-indigo-300">{formatTime(endTime)}</span>
            </div>
            <div className="h-4 w-px bg-slate-600"></div>
            <div>
              <span className="font-bold uppercase mr-2">Duration:</span>
              <span className="font-mono text-slate-300">{(endTime - startTime).toFixed(2)}s</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-500">Subtitle Text</label>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
              placeholder="Enter text..."
              rows={3}
              disabled={transcriber.isBusy}
            />
            <p className="text-[10px] text-slate-500 text-right">Press Enter to save, Shift+Enter for new line</p>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleTranscribeAudio}
              disabled={transcriber.isBusy}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                !audioBlob || transcriber.isBusy
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              } transition`}
            >
              {transcriber.isBusy ? (
                <>
                  <MicOff size={16} /> Transcribing...
                </>
              ) : (
                <>
                  <Mic size={16} /> Transcribe Audio
                </>
              )}
            </button>

            {transcriber.isModelLoading && (
              <div className="text-xs text-slate-400">
                Loading model...
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleRemove}
              className="px-2 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition"
            >
              Remove
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim() || transcriber.isBusy}
              className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16}/> Save
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EditSubtitleLineModal;