
import { useState, useEffect } from 'react';
import { useAppStore } from '../../core/store';
import { ffmpegService } from '../../core/ffmpeg';
import { storeMedia } from '../../core/db';
import { AnkiCard } from '../../core/types';

export const useMediaProcessing = (
  videoFile: File | null,
  previewCard: AnkiCard | null,
  isExporting: boolean,
  onExportReady: () => void
) => {
  const { ankiCards, updateCard } = useAppStore();
  const [backgroundProcessingId, setBackgroundProcessingId] = useState<string | null>(null);

  // --- Background Audio Extraction Queue ---
  useEffect(() => {
    if (backgroundProcessingId) return;

    const cards = useAppStore.getState().ankiCards;
    let nextCard = previewCard && cards.find(c => c.id === previewCard.id && c.audioStatus === 'pending');

    if (!nextCard) {
      nextCard = cards.find(c => c.audioStatus === 'pending');
    }

    if (nextCard && videoFile) {
      processCardAudio(nextCard.id, nextCard.subtitleId);
    } else if (!nextCard && isExporting) {
      finalizeExportIfReady();
    }
  }, [ankiCards, backgroundProcessingId, previewCard, isExporting, videoFile]);

  const processCardAudio = async (cardId: string, subtitleId: number) => {
    if (!videoFile) return;

    const sub = useAppStore.getState().subtitleLines.find(s => s.id === subtitleId);
    if (!sub) {
      updateCard(cardId, { audioStatus: 'error' });
      return;
    }

    setBackgroundProcessingId(cardId);
    updateCard(cardId, { audioStatus: 'processing' });

    try {
      const blob = await ffmpegService.extractAudioClip(videoFile, sub.startTime, sub.endTime);

      // Store Blob in IndexedDB
      const audioId = crypto.randomUUID();
      await storeMedia(audioId, blob);

      const currentCards = useAppStore.getState().ankiCards;
      if (currentCards.find(c => c.id === cardId)) {
        updateCard(cardId, { audioStatus: 'done', audioRef: audioId });
      }
    } catch (e) {
      console.error("Audio extraction failed", e);
      updateCard(cardId, { audioStatus: 'error' });
    } finally {
      setBackgroundProcessingId(null);
    }
  };

  const finalizeExportIfReady = () => {
    const cards = useAppStore.getState().ankiCards;
    const pendingAudio = cards.some(c => c.audioStatus === 'pending' || c.audioStatus === 'processing');

    if (!pendingAudio) {
      onExportReady();
    }
  }

  return {
    isProcessing: !!(backgroundProcessingId)
  };
};
