import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Layers, Link2, Link2Off, Download, CloudUpload, ChevronDown, NotebookPen, Tags, Trash2, RefreshCw} from 'lucide-react';
import CardItem from '@/components/CardItem';
import {AnkiCard} from '@/services/types.ts';
import TagInput from '@/components/TagInput';
import {useTranslation} from 'react-i18next';

interface DeckColumnProps {
  cards: AnkiCard[];
  onDelete: (id: string) => void;
  onPreview: (card: AnkiCard) => void;
  onSyncCard: (id: string) => void;
  onSyncCards: () => void;
  onOpenTemplateSettings: () => void;
  onExport: () => void;
  onOpenAnkiSettings: () => void;
  onRefreshAnkiConnection?: () => Promise<void> | void;
  onDeleteSynced: () => void;
  isConnected?: boolean;
  decks?: string[];
  ankiTags?: string[];
  ankiConnectUrl?: string;
  projectName?: string;
  selectedDeck?: string;
  onDeckChange?: (deckName: string) => void;
  globalTags?: string[];
  onGlobalTagsChange?: (tags: string[]) => void;
  className?: string;
}

const DeckColumn: React.FC<DeckColumnProps> = ({
                                                 cards,
                                                 onDelete,
                                                 onPreview,
                                                 onSyncCard,
                                                 onSyncCards,
                                                 onOpenTemplateSettings,
                                                 onExport,
                                                 onOpenAnkiSettings,
                                                 onRefreshAnkiConnection,
                                                 onDeleteSynced,
                                                 isConnected,
                                                 decks = [],
                                                 ankiTags = [],
                                                 projectName = 'Subs2Anki Export',
                                                 selectedDeck: propSelectedDeck,
                                                 onDeckChange,
                                                 globalTags = [],
                                                 onGlobalTagsChange,
                                                 className = ''
                                               }) => {
  const {t} = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState<boolean>(false);
  const [isRefreshingAnki, setIsRefreshingAnki] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleRefreshAnkiConnection = async () => {
    if (!onRefreshAnkiConnection || isRefreshingAnki) return;
    try {
      setIsRefreshingAnki(true);
      await onRefreshAnkiConnection();
    } finally {
      setIsRefreshingAnki(false);
    }
  };

  // 点击外部，关闭Deck的下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (dropdownRef.current.contains(event.target as Node)) return;
      setIsDropdownOpen(false);
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const cardStats = useMemo(() => {
    let unsyncedCount = 0;
    let syncingCount = 0;
    let syncedCount = 0;
    let notDoneAudioCount = 0;
    let doneAudioButNotSyncedCount = 0;

    for (const card of cards) {
      if (card.syncStatus === 'unsynced') unsyncedCount++;
      if (card.syncStatus === 'syncing') syncingCount++;
      if (card.syncStatus === 'synced') syncedCount++;
      if (card.audioStatus !== 'done') notDoneAudioCount++;
      if (card.audioStatus === 'done' && card.syncStatus === 'unsynced') doneAudioButNotSyncedCount++;
    }
    return {
      total: cards.length,
      unsyncedCount,
      syncingCount,
      syncedCount,
      notDoneAudioCount,
      doneAudioButNotSyncedCount,
      isSyncCardsDisabled: !isConnected || unsyncedCount === 0 || syncingCount > 0 || notDoneAudioCount > 0,
    };
  }, [cards, isConnected]);

  const selectedDeck = propSelectedDeck || (projectName ? `Subs2Anki::${projectName}` : 'Subs2Anki Export');

  return (
    <aside className={`w-80 flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-900/50 z-20 ${className}`}>

      {/* Logo Section */}
      <div className="h-14 flex items-center px-4 border-b border-slate-800 bg-slate-950 select-none">
        <div className="flex items-center gap-2 text-indigo-400">
          <Layers size={20} className="text-indigo-500"/>
          <span className="text-lg font-bold tracking-tight text-slate-200">{t("appTitle")}</span>
          <span className="text-xs font-medium text-slate-500 ml-2">ver {__APP_VERSION__}</span>
        </div>
      </div>

      {/* Deck Header */}
      <div className="p-3 z-50 border-b border-slate-800 flex flex-col gap-2 bg-slate-900/80 backdrop-blur">
        <div className="flex justify-between items-center">
          <div className="relative" ref={dropdownRef}>
            {isConnected ? (
              <div className="flex items-center min-w-0">
                <div className="relative w-full">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-sm text-slate-200 transition max-w-full"
                  >
                    <span className="truncate block">{selectedDeck}</span>
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
                <span
                  className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("deck")} ({cards.length})</span>
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
                  {globalTags.map((tag) => (
                    <span className="bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded text-xs"
                          key={tag}>{tag}</span>
                  ))}
                  {globalTags.length === 0 && (
                    <span
                      className="text-slate-500 text-xs">{t("modals.noTagsSpecified", {defaultValue: "No tags specified"})}</span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsTagsExpanded(!isTagsExpanded)}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              {isTagsExpanded ? t("modals.collapse", {defaultValue: "Collapse"}) : t("modals.edit", {defaultValue: "Edit"})}
            </button>
          </div>

          {isTagsExpanded && onGlobalTagsChange && (
            <div className="mb-3">
              <TagInput
                tags={globalTags}
                onTagsChange={onGlobalTagsChange}
                placeholder={t("modals.addGlobalTags", {defaultValue: "Add global tags..."})}
                availableTags={isConnected ? ankiTags : []}
              />
            </div>
          )}

        </div>

        <div className="flex justify-end items-center">
          <div className="flex gap-1">
            <button
              onClick={handleRefreshAnkiConnection}
              disabled={!onRefreshAnkiConnection || isRefreshingAnki}
              className="p-1.5 rounded text-slate-400 transition hover:bg-slate-700 hover:text-slate-200 disabled:opacity-50 disabled:hover:bg-transparent disabled:text-slate-600"
              title={t("modals.refreshAnkiConnection", {defaultValue: "Refresh Anki connection"})}
            >
              <RefreshCw size={14} className={isRefreshingAnki ? 'animate-spin' : ''}/>
            </button>
            <button
              onClick={onOpenAnkiSettings}
              className={`p-1.5 rounded text-slate-400 transition flex items-center ${
                isConnected
                  ? 'text-green-400 hover:bg-green-900/50 hover:text-green-300'
                  : 'text-red-400 hover:bg-red-900/50  hover:text-red-300'
              }`}
              title={isConnected ? t("modals.connectedClickToChange", {defaultValue: "Connected - Click to change settings"}) : t("modals.disconnectedClickToChange", {defaultValue: "Disconnected - Click to change settings"})}
            >
              {isConnected ?
                <Link2 size={14} className="text-green-400"/> :
                <Link2Off size={14} className="text-red-400"/>
              }
            </button>
          </div>
          <div className="w-px h-4 bg-slate-700 mx-1 self-center"></div>
          <button
            onClick={onOpenTemplateSettings}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition"
            title={t("templateEditor")}
          >
            <NotebookPen size={14}/>
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1 self-center"></div>
          <div className="flex items-center group">
            <button
              onClick={onSyncCards}
              disabled={cardStats.isSyncCardsDisabled}
              className="p-1.5 hover:bg-indigo-900/50 rounded text-indigo-400 hover:text-indigo-300 transition disabled:opacity-50 disabled:hover:bg-transparent disabled:text-slate-600"
              title={!isConnected ? t("modals.notConnectedToAnki", {defaultValue: "Not connected to Anki"}) : t("syncToAnki")}
            >
              <CloudUpload size={16}/>
            </button>
            <span hidden={cardStats.total === 0} className="text-[10px] font-mono ml-0.5 text-slate-500 group-hover:text-slate-400 transition-colors">
              ({cardStats.doneAudioButNotSyncedCount}/{cardStats.total})
            </span>
          </div>
          <button
            onClick={onDeleteSynced}
            disabled={cardStats.syncedCount === 0}
            className="p-1.5 hover:bg-red-900/50 rounded text-red-400 hover:text-red-300 transition disabled:opacity-50 disabled:hover:bg-transparent disabled:text-slate-600"
            title={t("deleteSyncedCards")}
          >
            <Trash2 size={16}/>
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1 self-center"></div>
          <button
            onClick={onExport}
            disabled={cards.length === 0}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition disabled:opacity-50 disabled:bg-slate-700 flex items-center gap-1"
            title={t("exportToAnki")}
          >
            <Download size={14}/>
            <span className="text-xs">{t("exportApkg")}</span>
          </button>
        </div>
      </div>

      {/* Deck List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
        {cards.length === 0 ? (
          <div
            className="text-center py-10 text-slate-600 text-xs">{t("modals.noCardsYet", {defaultValue: "No cards yet"})}</div>
        ) : (
          cards.map(card => (
            <CardItem
              key={card.id}
              card={card}
              onDelete={onDelete}
              onPreview={onPreview}
              onSyncCard={onSyncCard}
              isConnected={isConnected}
            />
          ))
        )}
      </div>
    </aside>
  );
};

export default DeckColumn;
