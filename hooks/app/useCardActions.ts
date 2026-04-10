import {MutableRefObject, useState} from 'react';
import {AnkiCard, SubtitleLine} from '@/services/types.ts';
import {VideoPlayerHandle} from '@/components/VideoPlayer.tsx';
import {formatTimestamp} from '@/services/time.ts';
import {storeMedia, deleteMedia} from '@/services/db.ts';

interface UseCardActionsParams {
  projectName: string;
  globalTags: string[];
  bulkCreateLimit: number;
  subtitleLines: SubtitleLine[];
  getSubtitleLine: (id: number) => SubtitleLine | null;
  addCard: (card: AnkiCard) => void;
  setSubtitleLineStatus: (id: number, status: 'normal' | 'locked' | 'ignored') => void;
  ankiCards: AnkiCard[];
  deleteCard: (id: string) => void;
  showNotification: (text: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  videoPlayerRef: MutableRefObject<VideoPlayerHandle | null>;
  convertToFurigana?: (text: string) => Promise<string> | string;
  storeMediaFn?: typeof storeMedia;
  deleteMediaFn?: typeof deleteMedia;
}

export const useCardActions = ({
  projectName,
  globalTags,
  bulkCreateLimit,
  subtitleLines,
  getSubtitleLine,
  addCard,
  setSubtitleLineStatus,
  ankiCards,
  deleteCard,
  showNotification,
  t,
  videoPlayerRef,
  convertToFurigana = (text: string) => text,
  storeMediaFn = storeMedia,
  deleteMediaFn = deleteMedia,
}: UseCardActionsParams) => {
  const [isBulkCreating, setIsBulkCreating] = useState<boolean>(false);
  const [bulkCreateProgress, setBulkCreateProgress] = useState({current: 0, total: 0});

  const createCardForSubtitleLine = async (sub: SubtitleLine) => {
    if (!videoPlayerRef.current) return;
    if (sub.status !== 'normal') return;

    const furigana = convertToFurigana(sub.text);
    const screenshot = await videoPlayerRef.current.captureFrameAt(sub.startTime);

    let screenshotRef = null;
    if (screenshot) {
      screenshotRef = crypto.randomUUID();
      await storeMediaFn(screenshotRef, screenshot);
    }

    const timestampStr = formatTimestamp(sub.startTime, 'dot', 1);
    const cardId = `${projectName.replace(/[\p{P}\s]/gu, '_')}_${timestampStr.replace(/:/g, '.')}_${sub.text.replace(/[\p{P}\s]/gu, '_')}`;

    const newCard: AnkiCard = {
      id: cardId,
      subtitleId: sub.id,
      text: sub.text,
      translation: '',
      notes: '',
      furigana: await furigana,
      tags: [...globalTags],
      screenshotRef,
      audioRef: null,
      audioStatus: 'pending',
      timestampStr,
      syncStatus: 'unsynced',
    };

    addCard(newCard);
    setSubtitleLineStatus(sub.id, 'locked');
  };

  const handleCreateCard = async (id: number) => {
    const s = getSubtitleLine(id);
    if (s) await createCardForSubtitleLine(s);
  };

  const handleBulkCreateCards = async () => {
    const normalSubtitles = subtitleLines.filter(sub => sub.status === 'normal');

    if (normalSubtitles.length === 0) {
      showNotification(t('notifications.noLines', {defaultValue: 'No subtitle lines to make cards'}));
      return;
    }

    const limitedSubtitles = normalSubtitles.slice(0, bulkCreateLimit);

    setIsBulkCreating(true);
    setBulkCreateProgress({current: 0, total: limitedSubtitles.length});

    for (let i = 0; i < limitedSubtitles.length; i++) {
      await createCardForSubtitleLine(limitedSubtitles[i]);
      setBulkCreateProgress({current: i + 1, total: limitedSubtitles.length});
    }

    setIsBulkCreating(false);

    showNotification(t('notifications.cardCreated', {
      num: limitedSubtitles.length,
    }));
  };

  const deleteScreenshotAndAudioForCard = async (id: string) => {
    const card = ankiCards.find(c => c.id === id);
    if (!card) return;
    try {
      if (card.screenshotRef) await deleteMediaFn(card.screenshotRef);
      if (card.audioRef) await deleteMediaFn(card.audioRef);
    } catch (e) {
      console.error('Failed to delete media from DB', e);
    }
  };

  const handleDeleteCard = async (id: string) => {
    await deleteScreenshotAndAudioForCard(id);
    deleteCard(id);
  };

  return {
    isBulkCreating,
    bulkCreateProgress,
    setBulkCreateProgress,
    setIsBulkCreating,
    createCardForSubtitleLine,
    handleCreateCard,
    handleBulkCreateCards,
    deleteScreenshotAndAudioForCard,
    handleDeleteCard,
  };
};


