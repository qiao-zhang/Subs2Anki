import {useState} from 'react';
import {AnkiCard, AnkiNoteType} from '@/services/types.ts';
import {checkConnection, syncToAnki} from '@/services/anki-connect.ts';

interface UseSyncActionsParams {
  ankiCards: AnkiCard[];
  ankiConnectUrl: string;
  projectName: string;
  ankiConfig: AnkiNoteType;
  globalTags: string[];
  selectedDeck: string;
  autoDeleteSynced: boolean;
  updateCardSyncStatus: (id: string, status: 'unsynced' | 'syncing' | 'synced') => void;
  handleDeleteCard: (id: string) => Promise<void>;
  openSettings: () => void;
  showNotification: (text: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  checkConnectionFn?: typeof checkConnection;
  syncToAnkiFn?: typeof syncToAnki;
}

export const useSyncActions = ({
  ankiCards,
  ankiConnectUrl,
  projectName,
  ankiConfig,
  globalTags,
  selectedDeck,
  autoDeleteSynced,
  updateCardSyncStatus,
  handleDeleteCard,
  openSettings,
  showNotification,
  t,
  checkConnectionFn = checkConnection,
  syncToAnkiFn = syncToAnki,
}: UseSyncActionsParams) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState({current: 0, total: 0});

  const handleSyncCard = async (id: string, targetDeckName?: string) => {
    const card = ankiCards.find(c => c.id === id);
    if (!card) return;

    if (card.syncStatus !== 'unsynced') {
      alert('This card already has been synced or is syncing to Anki.');
      return;
    }

    if (card.audioStatus !== 'done') {
      alert('Media files are not ready yet. Please wait for audio processing to complete.');
      return;
    }

    try {
      const connected = await checkConnectionFn(ankiConnectUrl);
      if (!connected) {
        alert('Could not connect to Anki. Please check your AnkiConnect settings and ensure Anki is running.');
        openSettings();
        return;
      }

      const deckName = targetDeckName || (projectName ? `Subs2Anki::${projectName}` : 'Subs2Anki Export');

      updateCardSyncStatus(id, 'syncing');
      await syncToAnkiFn(ankiConnectUrl, deckName, ankiConfig, [card], globalTags, (cur, tot) => {
        setSyncProgress({current: cur, total: tot});
      });

      updateCardSyncStatus(id, 'synced');

      if (autoDeleteSynced) {
        await handleDeleteCard(id);
      }
      showNotification(t('notifications.syncSuccess', {num: '1', deckName}));
    } catch (e) {
      console.error(e);
      alert(`Sync failed: ${(e as Error).message}`);
    }
  };

  const handleSyncCards = async () => {
    setIsSyncing(true);
    try {
      const connected = await checkConnectionFn(ankiConnectUrl);
      if (!connected) {
        setIsSyncing(false);
        alert('Could not connect to Anki. Please check your AnkiConnect settings and ensure Anki is running.');
        openSettings();
        return;
      }

      const unsyncedCards = ankiCards.filter(card => card.syncStatus === 'unsynced');

      if (unsyncedCards.length === 0) {
        alert('All cards have already been synced to Anki!');
        return;
      }

      unsyncedCards.forEach(card => {
        updateCardSyncStatus(card.id, 'syncing');
      });

      await syncToAnkiFn(ankiConnectUrl, selectedDeck, ankiConfig, unsyncedCards, globalTags, (cur, tot) => {
        setSyncProgress({current: cur, total: tot});
      }, async (cardId: string) => {
        if (autoDeleteSynced) {
          await handleDeleteCard(cardId);
        } else {
          updateCardSyncStatus(cardId, 'synced');
        }
      });

      showNotification(t('notifications.syncSuccess', {num: unsyncedCards.length, deckName: selectedDeck}));
    } catch (e) {
      console.error(e);
      alert(`Sync failed: ${(e as Error).message}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress({current: 0, total: 0});
    }
  };

  return {
    isSyncing,
    syncProgress,
    setSyncProgress,
    setIsSyncing,
    handleSyncCard,
    handleSyncCards,
  };
};

