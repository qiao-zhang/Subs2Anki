import React, {useState} from 'react';
import {Layers, Link2, Link2Off, Download, CloudUpload, ChevronDown, NotebookPen, Tags} from 'lucide-react';
import CardItem from '@/components/CardItem';
import {AnkiCard} from '@/services/types.ts';
import TagInput from '@/components/TagInput';

interface DeckColumnProps {
  cards: AnkiCard[];
  onDelete: (id: string) => void;
  onPreview: (card: AnkiCard) => void;
  onSyncCard: (id: string) => void;
  onOpenTemplateSettings: () => void;
  onExport: () => void;
  onSyncAnki: () => void;
  onOpenAnkiSettings: () => void;
  onDeleteSynced: () => void;
  isConnected?: boolean;
  decks?: string[];
  ankiConnectUrl?: string;
  projectName?: string;
  selectedDeck?: string;
  onDeckChange?: (deckName: string) => void;
  globalTags?: string[];
  onGlobalTagsChange?: (tags: string[]) => void;
}

const DeckColumn: React.FC<DeckColumnProps> = ({
                                                 cards,
                                                 onDelete,
                                                 onPreview,
                                                 onSyncCard,
                                                 onOpenTemplateSettings,
                                                 onExport,
                                                 onSyncAnki,
                                                 onOpenAnkiSettings,
                                                 onDeleteSynced,
                                                 isConnected,
                                                 decks = [],
                                                 ankiConnectUrl,
                                                 projectName = 'Subs2Anki Export',
                                                 selectedDeck: propSelectedDeck,
                                                 onDeckChange,
                                                 globalTags = [],
                                                 onGlobalTagsChange
                                               }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState<boolean>(false);

  // Use the selected deck from props
  const selectedDeck = propSelectedDeck || (projectName ? `Subs2Anki::${projectName}` : 'Subs2Anki Export');
  return (
    <aside className="w-80 flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-900/50 z-20">

      {/* Logo Section */}
      <div className="h-14 flex items-center px-4 border-b border-slate-800 bg-slate-950 select-none">
        <div className="flex items-center gap-2 text-indigo-400">
          <Layers size={20} className="text-indigo-500"/>
          <span className="text-lg font-bold tracking-tight text-slate-200">Subs2Anki</span>
        </div>
      </div>

      {/* Deck Header */}
      <div className="p-3 border-b border-slate-800 flex flex-col gap-2 bg-slate-900/80 backdrop-blur">
        <div className="flex justify-between items-center">
          <div className="relative">
            {isConnected ? (
              <div className="flex items-center">
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-sm text-slate-200 transition"
                  >
                    <span className="truncate max-w-[full]">{selectedDeck}</span>
                    <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}/>
                  </button>

                  {isDropdownOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-30 max-h-60 overflow-y-auto">
                      <div className="py-1">
                        {decks.map((deck, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              if (onDeckChange) {
                                onDeckChange(deck);
                              }
                              setIsDropdownOpen(false);
                            }}
                            className={`block w-full text-left px-3 py-2 text-sm hover:bg-slate-700 ${
                              selectedDeck === deck ? 'bg-slate-700 text-indigo-300' : 'text-slate-200'
                            }`}
                          >
                            <div className="truncate">{deck}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deck ({cards.length})</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Tags size={14} className="text-slate-400"/>
              {/*<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tags</span>*/}
              {!isTagsExpanded && (
                <div className="flex items-center align-middle flex-wrap gap-1">
                  {globalTags.map((tag, index) => (
                    <span className="bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded text-xs"
                          key={index}>{tag}</span>
                  ))}
                  {globalTags.length == 0 && (
                    <span className="text-slate-500 text-xs">No tags specified</span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsTagsExpanded(!isTagsExpanded)}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              {isTagsExpanded ? 'Collapse' : 'Edit'}
            </button>
          </div>

          {isTagsExpanded && onGlobalTagsChange && (
            <div className="mb-3">
              <TagInput
                tags={globalTags}
                onTagsChange={onGlobalTagsChange}
                placeholder="Add global tags..."
              />
            </div>
          )}

          {/* Show tags when collapsed */}

        </div>

        <div className="flex justify-end">
          <div className="flex gap-1">
            <button
              onClick={onOpenAnkiSettings}
              className={`p-1.5 rounded text-slate-400 transition flex items-center ${
                isConnected
                  ? 'text-green-400 hover:bg-green-900/50 hover:text-green-300'
                  : 'text-red-400 hover:bg-red-900/50  hover:text-red-300'
              }`}
              title={isConnected ? "Connected - Click to change settings" : "Disconnected - Click to change settings"}
            >
              {isConnected ?
                <Link2 size={14} className="text-green-400"/> :
                <Link2Off size={14} className="text-red-400"/>
              }
              {/*<svg width="16" height="16" fill="none" stroke="currentColor"*/}
              {/*  className="text-green-400"*/}
              {/*  xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"  viewBox="0 0 50 50">*/}
              {/*  <path d="M37.38,2H12.84C9.66,2,7,4.85,7,8v7.26c10.89,1.54,25.87,5.9,36,13.65V7.62C43,4.54,40.46,2,37.38,2z M38.93,13.68 c-0.06,0.38-0.34,0.68-0.7,0.79l-3,0.88l-0.97,2.98c-0.12,0.36-0.44,0.62-0.81,0.67c-0.05,0.01-0.1,0.01-0.14,0.01 c-0.33,0-0.64-0.16-0.83-0.43L30.71,16l-3.12-0.01c-0.38,0-0.73-0.22-0.9-0.56c-0.16-0.34-0.12-0.75,0.11-1.05l1.91-2.48 l-0.96-2.97C27.63,8.57,27.73,8.17,28,7.9c0.28-0.26,0.68-0.35,1.04-0.22l2.94,1.05l2.53-1.83c0.31-0.23,0.72-0.25,1.06-0.07 C35.9,7,36.11,7.36,36.1,7.74l-0.09,3.12l2.53,1.85C38.84,12.93,39,13.31,38.93,13.68z M7,17.27V42c0,1.86,0.92,3.39,2.09,4.41 C10.27,47.42,11.68,48,13,48h24.38c3.08,0,5.62-2.54,5.62-5.62V31.47C33.86,23.88,18.79,18.99,7,17.27z M30.71,31.57l-3.33,4.14 l1.52,5.09c0.16,0.55,0,1.13-0.42,1.51c-0.42,0.39-1.01,0.5-1.54,0.3l-4.96-1.89l-4.38,3.02C17.35,43.91,17.05,44,16.76,44 c-0.25,0-0.5-0.06-0.72-0.19c-0.5-0.28-0.79-0.8-0.77-1.37l0.27-5.31l-4.22-3.23c-0.45-0.34-0.67-0.9-0.56-1.46s0.52-1,1.07-1.15 l5.13-1.39l1.77-5.01c0.19-0.54,0.66-0.92,1.22-0.98c0.57-0.07,1.11,0.18,1.43,0.66l2.9,4.45l5.31,0.13 c0.57,0.02,1.08,0.35,1.32,0.86C31.14,30.53,31.07,31.13,30.71,31.57z"></path>*/}
              {/*</svg>*/}
              {/*<span className={`ml-1 text-xs hidden sm:inline ${isConnected ? 'text-green-400' : 'text-red-400'}`}>*/}
              {/*  {isConnected ? "Connected" : "Disconnected"}*/}
              {/*</span>*/}
            </button>
          </div>
          <div className="w-px h-4 bg-slate-700 mx-1 self-center"></div>
          <button
            onClick={onOpenTemplateSettings}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition"
            title="Template Settings"
          >
            <NotebookPen size={14}/>
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
            onClick={onDeleteSynced}
            disabled={cards.filter(card => card.syncStatus === 'synced').length === 0}
            className="p-1.5 hover:bg-red-900/50 rounded text-red-400 hover:text-red-300 transition disabled:opacity-50 disabled:hover:bg-transparent disabled:text-slate-600"
            title="Delete synced cards"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1 self-center"></div>
          <button
            onClick={onExport}
            disabled={cards.length === 0}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition disabled:opacity-50 disabled:bg-slate-700 flex items-center gap-1"
            title="Export .apkg"
          >
            <Download size={14}/>
            <span className="text-xs">Export .apkg</span>
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
              onPreview={onPreview}
              onSyncCard={onSyncCard}
            />
          ))
        )}
      </div>
    </aside>
  );
};

export default DeckColumn;
