import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { furiganaService } from '@/services/furigana.ts';
import { storeMedia } from '@/services/db.ts';
import { formatTimestamp } from '@/services/time.ts';
import type { FfmpegAvailability } from '@/services/ffmpeg-contract.ts';
import type { AnkiCard, SubtitleLine } from '@/services/types.ts';
import type { VideoPlayerHandle } from '@/components/VideoPlayer.tsx';

/**
 * Domain workflow hook for card creation.
 *
 * Boundary:
 * - Owns card-generation domain flow (furigana/media/card payload/progress/concurrency guard).
 * - Consumes dependencies from caller via callbacks/services.
 * - Does not own presentation-only UI state (modal visibility, layout toggles, panel open/close).
 */
interface BulkCreateProgress {
  current: number;
  total: number;
}

interface UseCardCreationFlowOptions {
  subtitleLines: SubtitleLine[];
  projectName: string;
  globalTags: string[];
  bulkCreateLimit: number;
  desktopFfmpegStatus: FfmpegAvailability | null;
  desktopFfmpegMessage: string | null;
  getSubtitleLine: (id: number) => SubtitleLine | undefined;
  getVideoPlayerHandle: () => VideoPlayerHandle | null;
  addCard: (card: AnkiCard) => void;
  setSubtitleLineStatus: (id: number, status: SubtitleLine['status']) => void;
  showNotification: (text: string) => void;
}

interface UseCardCreationFlowResult {
  isBulkCreating: boolean;
  bulkCreateProgress: BulkCreateProgress;
  handleCreateCard: (id: number) => Promise<void>;
  handleBulkCreateCards: () => Promise<void>;
  resetBulkCreationState: () => void;
}

export const useCardCreationFlow = ({
  subtitleLines,
  projectName,
  globalTags,
  bulkCreateLimit,
  desktopFfmpegStatus,
  desktopFfmpegMessage,
  getSubtitleLine,
  getVideoPlayerHandle,
  addCard,
  setSubtitleLineStatus,
  showNotification,
}: UseCardCreationFlowOptions): UseCardCreationFlowResult => {
  const { t } = useTranslation();
  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [bulkCreateProgress, setBulkCreateProgress] = useState<BulkCreateProgress>({ current: 0, total: 0 });
  const creatingRef = useRef(false);

  const createCardForSubtitleLine = async (sub: SubtitleLine) => {
    const player = getVideoPlayerHandle();
    if (!player) return;
    if (sub.status !== 'normal') return;

    const audioCanBeExtracted = !__TAURI_BUILD__ || desktopFfmpegStatus?.available !== false;
    if (!audioCanBeExtracted && desktopFfmpegMessage) {
      showNotification(desktopFfmpegMessage);
    }

    const furigana = furiganaService.convert(sub.text);
    const screenshot = await player.captureFrameAt(sub.startTime);

    let screenshotRef = null;
    if (screenshot) {
      screenshotRef = crypto.randomUUID();
      await storeMedia(screenshotRef, screenshot);
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
      audioStatus: audioCanBeExtracted ? 'pending' : 'error',
      audioErrorReason: audioCanBeExtracted ? undefined : 'ffmpeg_unavailable',
      timestampStr,
      syncStatus: 'unsynced',
    };

    addCard(newCard);
    setSubtitleLineStatus(sub.id, 'locked');
  };

  const handleCreateCard = async (id: number) => {
    if (creatingRef.current || isBulkCreating) {
      showNotification(t('notifications.creatingCards', { defaultValue: 'Creating cards is already in progress.' }));
      return;
    }

    creatingRef.current = true;
    const subtitle = getSubtitleLine(id);
    try {
      if (subtitle) {
        await createCardForSubtitleLine(subtitle);
      }
    } finally {
      creatingRef.current = false;
    }
  };

  const handleBulkCreateCards = async () => {
    if (creatingRef.current || isBulkCreating) {
      showNotification(t('notifications.creatingCards', { defaultValue: 'Creating cards is already in progress.' }));
      return;
    }

    creatingRef.current = true;
    const normalSubtitles = subtitleLines.filter(sub => sub.status === 'normal');
    if (normalSubtitles.length === 0) {
      showNotification(t('notifications.noLines', { defaultValue: 'No subtitle lines to make cards' }));
      creatingRef.current = false;
      return;
    }

    const limitedSubtitles = normalSubtitles.slice(0, bulkCreateLimit);
    setIsBulkCreating(true);
    setBulkCreateProgress({ current: 0, total: limitedSubtitles.length });

    try {
      for (let i = 0; i < limitedSubtitles.length; i++) {
        await createCardForSubtitleLine(limitedSubtitles[i]);
        setBulkCreateProgress({ current: i + 1, total: limitedSubtitles.length });
      }
    } finally {
      creatingRef.current = false;
      setIsBulkCreating(false);
    }

    showNotification(t('notifications.cardCreated', { num: limitedSubtitles.length }));
  };

  const resetBulkCreationState = () => {
    creatingRef.current = false;
    setIsBulkCreating(false);
    setBulkCreateProgress({ current: 0, total: 0 });
  };

  return {
    isBulkCreating,
    bulkCreateProgress,
    handleCreateCard,
    handleBulkCreateCards,
    resetBulkCreationState,
  };
};

