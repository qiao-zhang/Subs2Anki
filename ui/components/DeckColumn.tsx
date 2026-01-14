
import React from 'react';
import { Layers, Settings, Download, CloudUpload, Wifi } from 'lucide-react';
import { AnkiCard } from '../../core/types';
import CardItem from './CardItem';

interface DeckColumnProps {
  cards: AnkiCard[];
  isAnalyzing: boolean;
  onDelete: (id: string) => void;
  onAnalyze: (card: AnkiCard) => void;
  onPreview: (card: AnkiCard) => void;
  onOpenTemplateSettings: () => void;
  onExport: () => void;
  onSyncAnki: () => void;
  onOpenAnkiSettings: () => void;
}

const DeckColumn: React.FC<DeckColumnProps> = ({
                                                 cards,
                                                 isAnalyzing,
                                                 onDelete,
                                                 onAnalyze,
                                                 onPreview,
                                                 onOpenTemplateSettings,
                                                 onExport,
                                                 onSyncAnki,
                                                 onOpenAnkiSettings
                                               }) => {
  return (
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
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deck ({cards.length})</h2>
        <div className="flex gap-1">
          <button
            onClick={onOpenAnkiSettings}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition"
            title="AnkiConnect Settings"
          >
            <Wifi size={14}/>
          </button>
          <button
            onClick={onOpenTemplateSettings}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition"
            title="Template Settings"
          >
            <Settings size={14}/>
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1 self-center"></div>
          <button
            onClick={onSyncAnki}
            disabled={cards.length === 0}
            className="p-1.5 hover:bg-indigo-900/50 rounded text-indigo-400 hover:text-indigo-300 transition disabled:opacity-50 disabled:hover:bg-transparent disabled:text-slate-600"
            title="Sync to Anki"
          >
            <CloudUpload size={16}/>
          </button>
          <button
            onClick={onExport}
            disabled={cards.length === 0}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition disabled:opacity-50 disabled:bg-slate-700"
            title="Export .apkg"
          >
            <Download size={14}/>
          </button>
        </div>
      </div>

      {/* Deck List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
        {cards.length === 0 ? (
          <div className="text-center py-10 text-slate-600 text-xs">No cards yet</div>
        ) : (
          cards.map(card => (
            <CardItem
              key={card.id}
              card={card}
              onDelete={onDelete}
              onAnalyze={onAnalyze}
              onPreview={onPreview}
              isAnalyzing={isAnalyzing}
            />
          ))
        )}
      </div>
    </aside>
  );
};

export default DeckColumn;
