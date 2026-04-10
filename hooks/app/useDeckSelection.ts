import {useCallback, useEffect, useRef, useState} from 'react';

interface UseDeckSelectionParams {
  projectName: string;
  decks: string[];
  isConnectedViaAnkiConnect: boolean;
  isLoadingViaAnkiConnect: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  showNotification: (text: string) => void;
}

export const useDeckSelection = ({
  projectName,
  decks,
  isConnectedViaAnkiConnect,
  isLoadingViaAnkiConnect,
  t,
  showNotification,
}: UseDeckSelectionParams) => {
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const lastDeckAutoSwitchNoticeRef = useRef<string>('');

  const getDefaultDeckName = useCallback(() => {
    return projectName ? `Subs2Anki::${projectName}` : 'Subs2Anki Export';
  }, [projectName]);

  useEffect(() => {
    if (isLoadingViaAnkiConnect) return;

    if (!isConnectedViaAnkiConnect || decks.length === 0) {
      const defaultDeck = getDefaultDeckName();
      if (selectedDeck !== defaultDeck) {
        setSelectedDeck(defaultDeck);
      }
      return;
    }

    const firstDeck = decks[0];

    if (!selectedDeck) {
      if (selectedDeck !== firstDeck) {
        setSelectedDeck(firstDeck);
      }
      return;
    }

    if (!decks.includes(selectedDeck) && selectedDeck !== firstDeck) {
      const noticeKey = `${selectedDeck}->${firstDeck}`;
      if (lastDeckAutoSwitchNoticeRef.current !== noticeKey) {
        lastDeckAutoSwitchNoticeRef.current = noticeKey;
        showNotification(t('notifications.deckAutoSwitched', {
          defaultValue: 'Deck "{{fromDeck}}" no longer exists. Switched to "{{toDeck}}".',
          fromDeck: selectedDeck,
          toDeck: firstDeck,
        }));
      }
      setSelectedDeck(firstDeck);
    }
  }, [
    isLoadingViaAnkiConnect,
    isConnectedViaAnkiConnect,
    decks,
    selectedDeck,
    getDefaultDeckName,
    t,
    showNotification,
  ]);

  return {
    selectedDeck,
    setSelectedDeck,
    getDefaultDeckName,
  };
};

