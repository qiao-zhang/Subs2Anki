import React from 'react';
import { AnkiCard } from '../../core/types';
import { Trash2, Wand2, Image as ImageIcon } from 'lucide-react';

interface CardItemProps {
  card: AnkiCard;
  onDelete: (id: string) => void;
  onAnalyze: (card: AnkiCard) => void;
  isAnalyzing: boolean;
}

/**
 * Displays a single Flashcard in the deck list.
 * 
 * Shows:
 * - Screenshot thumbnail.
 * - Dialogue text.
 * - AI Analysis results (Translation, Notes).
 * - Action buttons (Delete, Analyze).
 */
const CardItem: React.FC<CardItemProps> = ({ card, onDelete, onAnalyze, isAnalyzing }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-3 border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
      <div className="flex gap-4">
        {/* Screenshot Thumbnail Section */}
        <div className="w-32 h-20 bg-black rounded overflow-hidden flex-shrink-0 relative border border-slate-700">
          {card.screenshotDataUrl ? (
            <img 
              src={card.screenshotDataUrl} 
              alt="Scene" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-slate-600" />
            </div>
          )}
          {/* Timestamp overlay */}
          <div className="absolute bottom-0 right-0 bg-black/60 text-xs px-1 text-white">
            {card.timestampStr}
          </div>
        </div>

        {/* Content Section: Text and Analysis */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-lg leading-tight mb-1 truncate">
            {card.text}
          </h4>
          
          {card.translation && (
            <p className="text-emerald-400 text-sm mb-1">{card.translation}</p>
          )}
          
          {card.notes && (
            <p className="text-slate-400 text-xs italic line-clamp-2">{card.notes}</p>
          )}

          {!card.translation && !card.notes && (
            <p className="text-slate-500 text-xs italic">No analysis data yet.</p>
          )}
        </div>

        {/* Action Buttons Section */}
        <div className="flex flex-col gap-2 justify-start">
          <button
            onClick={() => onDelete(card.id)}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors"
            title="Delete Card"
          >
            <Trash2 size={18} />
          </button>
          
          {/* Analysis Button: Disabled during processing */}
          <button
            onClick={() => onAnalyze(card)}
            disabled={isAnalyzing}
            className={`p-2 rounded transition-colors ${
              card.translation 
                ? 'text-emerald-500 hover:bg-emerald-950/30' 
                : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30'
            } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="AI Analyze"
          >
            <Wand2 size={18} className={isAnalyzing ? "animate-pulse" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardItem;