
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
  const [backgroundGifProcessingId, setBackgroundGifProcessingId] = useState<string | null>(null);

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
    } else if (!nextCard && isExporting && !backgroundGifProcessingId) {
      // Only finish export if GIF queue is also empty
      finalizeExportIfReady();
    }
  }, [ankiCards, backgroundProcessingId, previewCard, isExporting, videoFile, backgroundGifProcessingId]);

  // --- Background GIF Extraction Queue ---
  useEffect(() => {
    if (backgroundGifProcessingId) return;

    const cards = useAppStore.getState().ankiCards;
    // 1. Prioritize preview card GIF
    let nextCard = previewCard && cards.find(c => c.id === previewCard.id && c.gifStatus === 'pending');

    // 2. Then others
    if (!nextCard) {
      nextCard = cards.find(c => c.gifStatus === 'pending');
    }

    if (nextCard && videoFile) {
      processCardGif(nextCard.id, nextCard.subtitleId);
    } else if (!nextCard && isExporting && !backgroundProcessingId) {
      finalizeExportIfReady();
    }
  }, [ankiCards, backgroundGifProcessingId, previewCard, isExporting, videoFile, backgroundProcessingId]);


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

  const processCardGif = async (cardId: string, subtitleId: number) => {
    if (!videoFile) return;

    const sub = useAppStore.getState().subtitleLines.find(s => s.id === subtitleId);
    if (!sub) {
      updateCard(cardId, { gifStatus: 'error' });
      return;
    }

    setBackgroundGifProcessingId(cardId);
    updateCard(cardId, { gifStatus: 'processing' });

    try {
      const gifBase64 = await ffmpegService.extractGifClip(videoFile, sub.startTime, sub.endTime);

      // Store GIF Base64 in IndexedDB
      const gifId = crypto.randomUUID();
      await storeMedia(gifId, gifBase64);

      const currentCards = useAppStore.getState().ankiCards;
      if (currentCards.find(c => c.id === cardId)) {
        updateCard(cardId, { gifStatus: 'done', gifRef: gifId });
      }
    } catch (e) {
      console.error("GIF extraction failed", e);
      updateCard(cardId, { gifStatus: 'error' });
    } finally {
      setBackgroundGifProcessingId(null);
    }
  };

  const finalizeExportIfReady = () => {
    const cards = useAppStore.getState().ankiCards;
    const pendingAudio = cards.some(c => c.audioStatus === 'pending' || c.audioStatus === 'processing');
    const pendingGif = cards.some(c => c.gifStatus === 'pending' || c.gifStatus === 'processing');

    if (!pendingAudio && !pendingGif) {
      onExportReady();
    }
  }

  return {
    isProcessing: !!(backgroundProcessingId || backgroundGifProcessingId)
  };
};
