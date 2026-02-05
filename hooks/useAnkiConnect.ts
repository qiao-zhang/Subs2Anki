import { useState, useEffect } from 'react';
import { checkConnection, getDecks } from '@/services/anki-connect.ts';

interface UseAnkiConnectResult {
  isConnected: boolean;
  decks: string[];
  isLoading: boolean;
  refreshDecks: () => Promise<void>;
}

export const useAnkiConnect = (ankiConnectUrl: string): UseAnkiConnectResult => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [decks, setDecks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAndFetchDecks = async () => {
    setIsLoading(true);
    try {
      const connected = await checkConnection(ankiConnectUrl);
      setIsConnected(connected);
      
      if (connected) {
        const deckList = await getDecks(ankiConnectUrl);
        setDecks(deckList);
      } else {
        setDecks([]);
      }
    } catch (error) {
      console.error('Error checking AnkiConnect connection or fetching decks:', error);
      setIsConnected(false);
      setDecks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAndFetchDecks().then();
  }, [ankiConnectUrl]);

  return {
    isConnected,
    decks,
    isLoading,
    refreshDecks: checkAndFetchDecks
  };
};