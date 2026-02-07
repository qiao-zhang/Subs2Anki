import {useState, useEffect} from 'react';
import {useAppStore} from '@/services/store.ts';
import {ffmpegService} from '@/services/ffmpeg.ts';
import {storeMedia} from '@/services/db.ts';
import {AnkiCard} from '@/services/types.ts';

export const useMediaProcessing = (
  videoFile: File | null,
  previewCard: AnkiCard | null
) => {
  const {ankiCards, updateCardAudioStatus, getSubtitleLine} = useAppStore();
  const [backgroundProcessingId, setBackgroundProcessingId] = useState<string | null>(null);

  // --- Background Audio Extraction Queue ---
  useEffect(() => {
    if (backgroundProcessingId) return;

    let nextCard = previewCard && ankiCards.find(c => c.id === previewCard.id && c.audioStatus === 'pending');

    if (!nextCard) {
      nextCard = ankiCards.find(c => c.audioStatus === 'pending');
    }

    if (nextCard) {
      processCardAudio(nextCard.id, nextCard.subtitleId).then();
    }
  }, [ankiCards, backgroundProcessingId, previewCard, videoFile]);

  const processCardAudio = async (cardId: string, subtitleId: number) => {
    if (!videoFile) return;

    const sub = getSubtitleLine(subtitleId);
    if (!sub) {
      updateCardAudioStatus(cardId, 'error');
      return;
    }

    setBackgroundProcessingId(cardId);
    updateCardAudioStatus(cardId, 'processing');

    try {
      const blob = await ffmpegService.extractAudioClip(videoFile, sub.startTime, sub.endTime);

      // Store Blob in IndexedDB
      const audioId = crypto.randomUUID();
      await storeMedia(audioId, blob);

      const currentCards = useAppStore.getState().ankiCards;
      if (currentCards.find(c => c.id === cardId)) {
        updateCardAudioStatus(cardId, 'done', audioId);
      }
    } catch (e) {
      console.error("Audio extraction failed", e);
      updateCardAudioStatus(cardId, 'error');
    } finally {
      setBackgroundProcessingId(null);
    }
  };
  return {
    isProcessing: !!(backgroundProcessingId)
  };
};
