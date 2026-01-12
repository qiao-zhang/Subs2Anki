/// <reference lib="dom" />
import React, { useEffect, useRef, useState } from 'react';
import { AnkiCard } from '../../core/types';
import { X, Play, Loader2, FileAudio } from 'lucide-react';

interface CardPreviewModalProps {
  isOpen: boolean;
  card: AnkiCard | null;
  onClose: () => void;
}

const CardPreviewModal: React.FC<CardPreviewModalProps> = ({ isOpen, card, onClose }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isOpen && card?.audioBlob) {
      const url = URL.createObjectURL(card.audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl(null);
    }
  }, [isOpen, card?.audioBlob]);

  if (!isOpen || !card) return null;

  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
          <h2 className="text-lg font-bold text-white">Card Preview</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">

          {/* Image & Audio Section */}
          <div className="relative aspect-video bg-black rounded-lg border border-slate-700 overflow-hidden group">
            {card.screenshotDataUrl ? (
              <img src={card.screenshotDataUrl} className="w-full h-full object-contain" alt="Screenshot" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
            )}

            {/* Audio Control Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
              {card.audioStatus === 'done' && audioUrl ? (
                <button
                  onClick={handlePlayAudio}
                  className="bg-slate-900/80 hover:bg-indigo-600 text-white backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-lg border border-slate-700 hover:border-indigo-500"
                >
                  <Play size={16} fill="currentColor" /> Play Audio
                  <audio ref={audioRef} src={audioUrl} />
                </button>
              ) : card.audioStatus === 'processing' || card.audioStatus === 'pending' ? (
                <div className="bg-slate-900/80 text-slate-300 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-slate-700">
                  <Loader2 size={16} className="animate-spin" /> Processing Audio...
                </div>
              ) : (
                <div className="bg-slate-900/80 text-red-400 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-slate-700">
                  <FileAudio size={16} /> Audio Unavailable
                </div>
              )}
            </div>
          </div>

          {/* Text Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase font-bold text-slate-500 block mb-1">Text (Front)</label>
              <div className="text-xl font-medium text-white bg-slate-800/50 p-3 rounded border border-slate-700/50">
                {card.text}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase font-bold text-emerald-500/80 block mb-1">Translation</label>
                <div className="text-sm text-slate-200 bg-slate-800/50 p-3 rounded border border-slate-700/50 min-h-[3rem]">
                  {card.translation || <span className="text-slate-600 italic">No translation generated</span>}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase font-bold text-amber-500/80 block mb-1">Notes</label>
                <div className="text-sm text-slate-200 bg-slate-800/50 p-3 rounded border border-slate-700/50 min-h-[3rem] whitespace-pre-wrap">
                  {card.notes || <span className="text-slate-600 italic">No notes generated</span>}
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition">Close</button>
        </div>
      </div>
    </div>
  );
};

export default CardPreviewModal;
