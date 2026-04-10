import {act, renderHook, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {useDeckSelection} from '@/hooks/app/useDeckSelection.ts';

describe('useDeckSelection', () => {
  const t = vi.fn((key: string, options?: Record<string, unknown>) => {
    if (key === 'notifications.deckAutoSwitched') {
      return `switched ${String(options?.fromDeck)} -> ${String(options?.toDeck)}`;
    }
    return key;
  });

  it('falls back to default deck when disconnected', async () => {
    const showNotification = vi.fn();

    const {result} = renderHook(() =>
      useDeckSelection({
        projectName: 'ProjectA',
        decks: [],
        isConnectedViaAnkiConnect: false,
        isLoadingViaAnkiConnect: false,
        t,
        showNotification,
      })
    );

    await waitFor(() => {
      expect(result.current.selectedDeck).toBe('Subs2Anki::ProjectA');
    });
    expect(showNotification).not.toHaveBeenCalled();
  });

  it('selects first deck when deck list is available and no deck selected', async () => {
    const showNotification = vi.fn();

    const {result} = renderHook(() =>
      useDeckSelection({
        projectName: 'ProjectA',
        decks: ['Deck1', 'Deck2'],
        isConnectedViaAnkiConnect: true,
        isLoadingViaAnkiConnect: false,
        t,
        showNotification,
      })
    );

    await waitFor(() => {
      expect(result.current.selectedDeck).toBe('Deck1');
    });
    expect(showNotification).not.toHaveBeenCalled();
  });

  it('switches to first deck and notifies once when current deck is invalid', async () => {
    const showNotification = vi.fn();

    const {result, rerender} = renderHook(
      ({decks}) =>
        useDeckSelection({
          projectName: 'ProjectA',
          decks,
          isConnectedViaAnkiConnect: true,
          isLoadingViaAnkiConnect: false,
          t,
          showNotification,
        }),
      {
        initialProps: {
          decks: ['Deck1', 'Deck2'],
        },
      }
    );

    await waitFor(() => {
      expect(result.current.selectedDeck).toBe('Deck1');
    });

    act(() => {
      result.current.setSelectedDeck('OldDeck');
    });

    rerender({decks: ['Deck1', 'Deck2']});

    await waitFor(() => {
      expect(result.current.selectedDeck).toBe('Deck1');
    });

    expect(showNotification).toHaveBeenCalledTimes(1);
    expect(showNotification).toHaveBeenCalledWith('switched OldDeck -> Deck1');

    rerender({decks: ['Deck1', 'Deck2']});
    expect(showNotification).toHaveBeenCalledTimes(1);
  });
});

