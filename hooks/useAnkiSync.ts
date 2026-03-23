import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AnkiCard, AnkiNoteType } from '@/services/types.ts';
import { checkConnection, syncToAnki } from '@/services/anki-connect.ts';

interface SyncProgress {
  current: number;
  total: number;
}

interface UseAnkiSyncOptions {
  ankiCards: AnkiCard[];
  ankiConnectUrl: string;
  ankiConfig: AnkiNoteType;
  selectedDeck: string;
  globalTags: string[];
  projectName: string;
  autoDeleteSynced: boolean;
  onDeleteCard: (id: string) => Promise<void>;
  onOpenSettings: () => void;
  onUpdateCardSyncStatus: (id: string, status: 'unsynced' | 'syncing' | 'synced') => void;
  showNotification: (text: string) => void;
}

interface UseAnkiSyncResult {
  isSyncing: boolean;
  syncProgress: SyncProgress;
  syncCard: (id: string, targetDeckName?: string) => Promise<void>;
  syncCards: () => Promise<void>;
}

export const useAnkiSync = ({
  ankiCards,
  ankiConnectUrl,
  ankiConfig,
  selectedDeck,
  globalTags,
  projectName,
  autoDeleteSynced,
  onDeleteCard,
  onOpenSettings,
  onUpdateCardSyncStatus,
  showNotification,
}: UseAnkiSyncOptions): UseAnkiSyncResult => {
  const { t } = useTranslation();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ current: 0, total: 0 });
  const bulkSyncInProgressRef = useRef(false);
  const syncingCardIdsRef = useRef<Set<string>>(new Set());

  const syncCard = async (id: string, targetDeckName?: string) => {
    if (isSyncing || bulkSyncInProgressRef.current || syncingCardIdsRef.current.has(id)) {
      showNotification(t('notifications.syncInProgress', { defaultValue: 'Sync is already in progress.' }));
      return;
    }

    const card = ankiCards.find(c => c.id === id);
    if (!card) return;

    if (card.syncStatus !== 'unsynced') {
      showNotification(t('notifications.cardAlreadySynced', { defaultValue: 'This card has already synced or is currently syncing to Anki.' }));
      return;
    }

    if (card.audioStatus !== 'done') {
      showNotification(t('notifications.mediaNotReady', { defaultValue: 'Media files are not ready yet. Please wait for audio processing to complete.' }));
      return;
    }

    try {
      syncingCardIdsRef.current.add(id);
      const connected = await checkConnection(ankiConnectUrl);
      if (!connected) {
        showNotification(t('notifications.ankiConnectionFailed', { defaultValue: 'Could not connect to Anki. Please check your AnkiConnect settings and ensure Anki is running.' }));
        onOpenSettings();
        return;
      }

      const deckName = targetDeckName || (projectName ? `Subs2Anki::${projectName}` : 'Subs2Anki Export');
      onUpdateCardSyncStatus(id, 'syncing');
      const result = await syncToAnki(ankiConnectUrl, deckName, ankiConfig, [card], globalTags, (cur, tot) => {
        setSyncProgress({ current: cur, total: tot });
      });

      const failure = result.failed.find(item => item.id === id);
      if (failure) {
        onUpdateCardSyncStatus(id, 'unsynced');
        showNotification(t('notifications.syncFailed', { defaultValue: 'Sync failed: {{error}}', error: failure.reason }));
        return;
      }

      if (!result.succeededIds.includes(id)) {
        onUpdateCardSyncStatus(id, 'unsynced');
        showNotification(t('notifications.syncCardRejected', { defaultValue: 'Sync failed: The card was not accepted by Anki.' }));
        return;
      }

      onUpdateCardSyncStatus(id, 'synced');
      if (autoDeleteSynced) {
        await onDeleteCard(id);
      }
      showNotification(t('notifications.syncSuccess', { num: '1', deckName }));
    } catch (e) {
      console.debug('[useAnkiSync] syncCard failed', e);
      onUpdateCardSyncStatus(id, 'unsynced');
      showNotification(t('notifications.syncFailed', { defaultValue: 'Sync failed: {{error}}', error: (e as Error).message }));
    } finally {
      syncingCardIdsRef.current.delete(id);
    }
  };

  const syncCards = async () => {
    if (isSyncing || bulkSyncInProgressRef.current || syncingCardIdsRef.current.size > 0) {
      showNotification(t('notifications.syncInProgress', { defaultValue: 'Sync is already in progress.' }));
      return;
    }

    bulkSyncInProgressRef.current = true;
    setIsSyncing(true);
    try {
      const connected = await checkConnection(ankiConnectUrl);
      if (!connected) {
        setIsSyncing(false);
        showNotification(t('notifications.ankiConnectionFailed', { defaultValue: 'Could not connect to Anki. Please check your AnkiConnect settings and ensure Anki is running.' }));
        onOpenSettings();
        return;
      }

      const unsyncedCards = ankiCards.filter(card => card.syncStatus === 'unsynced');
      if (unsyncedCards.length === 0) {
        showNotification(t('notifications.allCardsSynced', { defaultValue: 'All cards have already been synced to Anki.' }));
        return;
      }

      unsyncedCards.forEach(card => {
        onUpdateCardSyncStatus(card.id, 'syncing');
      });

      const result = await syncToAnki(ankiConnectUrl, selectedDeck, ankiConfig, unsyncedCards, globalTags, (cur, tot) => {
        setSyncProgress({ current: cur, total: tot });
      }, async (cardId: string) => {
        if (autoDeleteSynced) {
          await onDeleteCard(cardId);
        } else {
          onUpdateCardSyncStatus(cardId, 'synced');
        }
      });

      result.failed.forEach(({ id }) => {
        onUpdateCardSyncStatus(id, 'unsynced');
      });

      if (result.succeededIds.length > 0) {
        showNotification(t('notifications.syncSuccess', { num: result.succeededIds.length, deckName: selectedDeck }));
      }

      if (result.failed.length > 0) {
        const summary = t('notifications.syncCompletedWithFailures', {
          defaultValue: 'Sync completed with {{count}} failure(s).',
          count: result.failed.length,
        });
        const details = result.failed
          .slice(0, 3)
          .map(({ id, reason }) => `- ${id}: ${reason}`)
          .join('\n');
        const suffix = result.failed.length > 3
          ? t('notifications.andMoreFailures', {
            defaultValue: '...and {{count}} more failure(s).',
            count: result.failed.length - 3,
          })
          : '';
        showNotification(`${summary}\n${details}${suffix ? `\n${suffix}` : ''}`);
      }
    } catch (e) {
      console.debug('[useAnkiSync] syncCards failed', e);
      ankiCards
        .filter(card => card.syncStatus === 'syncing')
        .forEach(card => onUpdateCardSyncStatus(card.id, 'unsynced'));
      showNotification(t('notifications.syncFailed', { defaultValue: 'Sync failed: {{error}}', error: (e as Error).message }));
    } finally {
      bulkSyncInProgressRef.current = false;
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  };

  return {
    isSyncing,
    syncProgress,
    syncCard,
    syncCards,
  };
};

