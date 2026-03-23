import { useCallback } from 'react';
import type { AnkiCard } from '@/services/types.ts';
import { deleteMedia } from '@/services/db.ts';

interface UseCardMediaDeletionOptions {
  ankiCards: AnkiCard[];
  deleteCard: (id: string) => void;
  showNotification: (text: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

interface UseCardMediaDeletionResult {
  deleteScreenshotAndAudioForCard: (id: string) => Promise<void>;
  handleDeleteCard: (id: string) => Promise<void>;
  handleDeleteSyncedCards: () => Promise<void>;
}

export const useCardMediaDeletion = ({
  ankiCards,
  deleteCard,
  showNotification,
  t,
}: UseCardMediaDeletionOptions): UseCardMediaDeletionResult => {
  const deleteScreenshotAndAudioForCard = useCallback(async (id: string) => {
    const card = ankiCards.find(c => c.id === id);
    if (!card) return;

    try {
      if (card.screenshotRef) {
        await deleteMedia(card.screenshotRef);
      }
      if (card.audioRef) {
        await deleteMedia(card.audioRef);
      }
    } catch (error) {
      console.debug('[useCardMediaDeletion] Failed to delete media from IndexedDB', error);
    }
  }, [ankiCards]);

  const handleDeleteCard = useCallback(async (id: string) => {
    await deleteScreenshotAndAudioForCard(id);
    deleteCard(id);
  }, [deleteCard, deleteScreenshotAndAudioForCard]);

  const handleDeleteSyncedCards = useCallback(async () => {
    const syncedCards = ankiCards.filter(card => card.syncStatus === 'synced');

    if (syncedCards.length === 0) {
      showNotification(t('notifications.noSyncedCardsToDelete', {
        defaultValue: 'No synced cards to delete.',
      }));
      return;
    }

    const confirmed = confirm(t('notifications.confirmDeleteSyncedCards', {
      defaultValue: 'Are you sure you want to delete {{num}} synced card(s)?',
      num: syncedCards.length,
    }));
    if (!confirmed) return;

    for (const card of syncedCards) {
      await handleDeleteCard(card.id);
    }

    showNotification(t('notifications.cardRemoved', { num: syncedCards.length }));
  }, [ankiCards, handleDeleteCard, showNotification, t]);

  return {
    deleteScreenshotAndAudioForCard,
    handleDeleteCard,
    handleDeleteSyncedCards,
  };
};

