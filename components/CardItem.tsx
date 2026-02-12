import React, {useEffect, useState} from 'react';
import {
  Trash2,
  Image as ImageIcon,
  Loader2,
  Clock,
  AlertCircle,
  CloudUpload,
  CheckCircle,
  LoaderCircle
} from 'lucide-react';
import {AnkiCard} from '@/services/types.ts';
import {getMedia} from '@/services/db.ts';
import { useTranslation } from 'react-i18next';

interface CardItemProps {
  card: AnkiCard;
  onDelete: (id: string) => void;
  onPreview: (card: AnkiCard) => void;
  onSyncCard: (id: string) => void;
  isConnected?: boolean;
}

/**
 * Displays a single Flashcard in the deck list.
 *
 * Shows:
 * - Screenshot thumbnail.
 * - Dialogue text.
 * - AI Analysis results (Translation, Notes).
 * - Action buttons (Delete, Analyze).
 * - Audio processing status.
 */
const CardItem: React.FC<CardItemProps> = ({card, onDelete, onPreview, onSyncCard, isConnected = false}) => {
  const { t } = useTranslation();
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);

  // Async load thumbnail from IDB
  useEffect(() => {
    let active = true;
    if (card.screenshotRef) {
      getMedia(card.screenshotRef).then(data => {
        if (active && data && typeof data === 'string') {
          setThumbnailSrc(data);
        }
      });
    } else {
      setThumbnailSrc(null);
    }
    return () => {
      active = false;
    };
  }, [card.screenshotRef]);

  const renderAudioStatus = () => {
    if (card.audioStatus === 'processing') {
      return <Loader2 size={12} className="animate-spin text-indigo-400"/>;
    }
    if (card.audioStatus === 'pending') {
      return <Clock size={12} className="text-slate-500"/>;
    }
    if (card.audioStatus === 'error') {
      return <AlertCircle size={12} className="text-red-500"/>;
    }
// TODO add a play button to preview the audio
    return null; // Done state is invisible to keep UI clean
  };

  return (
    <div
      className="bg-slate-800 rounded-lg p-4 mb-3 border border-slate-700 shadow-sm hover:border-slate-600 transition-colors select-none"
      onDoubleClick={() => onPreview(card)}
    >
      <div className="flex gap-4">
        {/* Screenshot Thumbnail Section */}
        <div
          className="w-32 h-20 bg-black rounded overflow-hidden flex-shrink-0 relative border border-slate-700 group cursor-pointer"
          onClick={() => onPreview(card)}>
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt="Snapshot"
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-slate-600"/>
            </div>
          )}
          {/* Timestamp overlay */}
          <div className="absolute bottom-0 right-0 bg-black/60 text-xs px-1 text-white flex items-center gap-1">
            {renderAudioStatus()}
            {card.timestampStr}
          </div>
        </div>

        {/* Content Section: Text and Analysis */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="font-semibold text-white text-lg leading-tight mb-1 truncate cursor-text select-text"
              onClick={(e) => e.stopPropagation()}>
            {card.furigana || card.text}
          </h4>

          {card.translation && (
            <p className="text-emerald-400 text-sm mb-1 truncate">{card.translation}</p>
          )}

          {card.notes && (
            <p className="text-slate-400 text-xs italic line-clamp-1">{card.notes}</p>
          )}

          {!card.translation && !card.notes && (
            <p className="text-slate-500 text-xs italic">{t("modals.doubleClickToPreview", { defaultValue: "Double-click to preview" })}</p>
          )}
        </div>

        {/* Action Buttons Section */}
        <div className="flex flex-col gap-2 justify-start">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSyncCard(card.id);
            }}
            disabled={card.syncStatus !== 'unsynced' || card.audioStatus !== 'done' || !isConnected}
            className={`p-2 rounded transition-colors ${
              card.syncStatus === 'unsynced' && card.audioStatus === 'done' && isConnected
                ? 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-700/50'
                : 'text-slate-600'
            }`}
            title={!isConnected ? t("modals.notConnectedToAnki", { defaultValue: "Not connected to Anki" }) : card.syncStatus === 'synced' ?
              t("modals.alreadySynced", { defaultValue: "Already synced" }) : card.syncStatus === 'syncing' ?
                t("modals.syncing", { defaultValue: "Syncing..." }) : card.audioStatus !== 'done' ? t("modals.mediaNotReady", { defaultValue: "Media not ready" }) : t("syncToAnki")}
          >
            {card.syncStatus === 'unsynced' && <CloudUpload size={18}/>}
            {card.syncStatus === 'synced' && <CheckCircle size={18}/>}
            {card.syncStatus === 'syncing' && <LoaderCircle size={18}/>}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors"
            title={t("deleteCard")}
          >
            <Trash2 size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardItem;
