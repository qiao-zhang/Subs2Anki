import {useState, useEffect} from 'react';
import {useAppStore} from '@/services/store.ts';
import {ffmpegService} from '@/services/ffmpeg.ts';
import {storeMedia} from '@/services/db.ts';
import {AnkiCard} from '@/services/types.ts';

export const useMediaProcessing = (
  videoFile: File | null,
  previewCard: AnkiCard | null
) => {
  const ankiCards = useAppStore(state => state.ankiCards);
  const updateCardAudioStatus = useAppStore(state => state.updateCardAudioStatus);
  const getSubtitleLine = useAppStore(state => state.getSubtitleLine);
  const audioVolume = useAppStore(state => state.audioVolume);

  const [backgroundProcessingId, setBackgroundProcessingId] = useState<string | null>(null);
  const [lastFinishedIndex, setLastFinishedIndex] = useState<number>(0);

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
  }, [ankiCards, previewCard, videoFile, lastFinishedIndex]);

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
      const blob = await ffmpegService.extractAudioClip(videoFile, sub.startTime, sub.endTime, audioVolume);

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
      setLastFinishedIndex(prev => prev + 1);
    }
  };

  return {
    isProcessing: !!(backgroundProcessingId)
  };
};
