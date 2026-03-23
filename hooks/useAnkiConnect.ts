import { useState, useEffect } from 'react';
import { checkConnection, getDecks, getTags } from '@/services/anki-connect.ts';

interface UseAnkiConnectResult {
  isConnected: boolean;
  decks: string[];
  tags: string[];
  isLoading: boolean;
  refreshDecks: () => Promise<void>;
  refreshTags: () => Promise<void>;
}

export const useAnkiConnect = (ankiConnectUrl: string): UseAnkiConnectResult => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [decks, setDecks] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAndFetchDecks = async () => {
    setIsLoading(true);
    try {
      const connected = await checkConnection(ankiConnectUrl);
      setIsConnected(connected);

      if (connected) {
        const deckList = await getDecks(ankiConnectUrl);
        setDecks(deckList);
        const tagList = await getTags(ankiConnectUrl);
        setTags(tagList);
      } else {
        setDecks([]);
        setTags([]);
      }
    } catch (error) {
      console.debug('[useAnkiConnect] Failed to check connection or fetch decks', error);
      setIsConnected(false);
      setDecks([]);
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTags = async () => {
    try {
      const connected = await checkConnection(ankiConnectUrl);
      if (connected) {
        const tagList = await getTags(ankiConnectUrl);
        setTags(tagList);
      }
    } catch (error) {
      console.debug('[useAnkiConnect] Failed to refresh tags', error);
    }
  };

  useEffect(() => {
    checkAndFetchDecks().then();
  }, [ankiConnectUrl]);

  return {
    isConnected,
    decks,
    tags,
    isLoading,
    refreshDecks: checkAndFetchDecks,
    refreshTags
  };
};
