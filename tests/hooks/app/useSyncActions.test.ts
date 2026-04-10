import {act, renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {useSyncActions} from '@/hooks/app/useSyncActions.ts';
import {AnkiCard} from '@/services/types.ts';

globalThis.alert = vi.fn();

describe('useSyncActions', () => {
  const card: AnkiCard = {
    id: 'c1',
    subtitleId: 1,
    text: 't',
    translation: '',
    notes: '',
    screenshotRef: null,
    audioRef: null,
    timestampStr: '00:01',
    audioStatus: 'done',
    syncStatus: 'unsynced',
  };

  it('syncs one card when connected', async () => {
    const updateCardSyncStatus = vi.fn();
    const syncToAnkiFn = vi.fn(async () => {});

    const {result} = renderHook(() =>
      useSyncActions({
        ankiCards: [card],
        ankiConnectUrl: 'http://localhost:8765',
        projectName: 'Proj',
        ankiConfig: {id: 1, name: 'n', css: '', fields: [], templates: []},
        globalTags: [],
        selectedDeck: 'Deck1',
        autoDeleteSynced: false,
        updateCardSyncStatus,
        handleDeleteCard: vi.fn(),
        openSettings: vi.fn(),
        showNotification: vi.fn(),
        t: (k) => k,
        checkConnectionFn: vi.fn(async () => true),
        syncToAnkiFn,
      })
    );

    await act(async () => {
      await result.current.handleSyncCard('c1', 'Deck1');
    });

    expect(updateCardSyncStatus).toHaveBeenCalledWith('c1', 'syncing');
    expect(syncToAnkiFn).toHaveBeenCalled();
    expect(updateCardSyncStatus).toHaveBeenCalledWith('c1', 'synced');
  });

  it('opens settings when sync all cannot connect', async () => {
    const openSettings = vi.fn();

    const {result} = renderHook(() =>
      useSyncActions({
        ankiCards: [card],
        ankiConnectUrl: 'http://localhost:8765',
        projectName: 'Proj',
        ankiConfig: {id: 1, name: 'n', css: '', fields: [], templates: []},
        globalTags: [],
        selectedDeck: 'Deck1',
        autoDeleteSynced: false,
        updateCardSyncStatus: vi.fn(),
        handleDeleteCard: vi.fn(),
        openSettings,
        showNotification: vi.fn(),
        t: (k) => k,
        checkConnectionFn: vi.fn(async () => false),
        syncToAnkiFn: vi.fn(async () => {}),
      })
    );

    await act(async () => {
      await result.current.handleSyncCards();
    });

    expect(openSettings).toHaveBeenCalled();
  });
});


