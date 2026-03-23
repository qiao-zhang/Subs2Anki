/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAnkiSync } from '@/hooks/useAnkiSync.ts';
import type { AnkiCard, AnkiNoteType } from '@/services/types.ts';

const mocks = vi.hoisted(() => ({
  checkConnection: vi.fn(),
  syncToAnki: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: {
      defaultValue?: string;
      num?: string | number;
      deckName?: string;
      error?: string;
      count?: number;
    }) => {
      if (_key === 'notifications.syncSuccess') {
        return `Synced ${options?.num} card(s) to ${options?.deckName}`;
      }
      if (_key === 'notifications.syncFailed') {
        return `Sync failed: ${options?.error}`;
      }
      if (_key === 'notifications.syncCompletedWithFailures') {
        return `Sync completed with ${options?.count} failure(s).`;
      }
      if (_key === 'notifications.andMoreFailures') {
        return `...and ${options?.count} more failure(s).`;
      }
      return options?.defaultValue ?? _key;
    },
  }),
}));

vi.mock('@/services/anki-connect.ts', () => ({
  checkConnection: mocks.checkConnection,
  syncToAnki: mocks.syncToAnki,
}));

const noteType: AnkiNoteType = {
  id: 1,
  name: 'Subs2Anki',
  css: '',
  fields: [{ name: 'Front', source: 'Text' }],
  templates: [{ Name: 'Card 1', Front: '{{Front}}', Back: '{{Front}}' }],
};

const makeCard = (overrides: Partial<AnkiCard> = {}): AnkiCard => ({
  id: 'card-1',
  subtitleId: 1,
  text: 'Text',
  translation: '',
  notes: '',
  screenshotRef: null,
  audioRef: 'audio-1',
  timestampStr: '00:01',
  audioStatus: 'done',
  syncStatus: 'unsynced',
  ...overrides,
});

function Probe(props: {
  cards: AnkiCard[];
  autoDeleteSynced?: boolean;
  onDeleteCard?: (id: string) => Promise<void>;
  onOpenSettings?: () => void;
  onUpdateCardSyncStatus?: (id: string, status: 'unsynced' | 'syncing' | 'synced') => void;
  showNotification?: (text: string) => void;
}) {
  const hook = useAnkiSync({
    ankiCards: props.cards,
    ankiConnectUrl: 'http://127.0.0.1:8765',
    ankiConfig: noteType,
    selectedDeck: 'Deck',
    globalTags: ['tag-a'],
    projectName: 'Project',
    autoDeleteSynced: props.autoDeleteSynced ?? false,
    onDeleteCard: props.onDeleteCard ?? vi.fn(async () => {}),
    onOpenSettings: props.onOpenSettings ?? vi.fn(),
    onUpdateCardSyncStatus: props.onUpdateCardSyncStatus ?? vi.fn(),
    showNotification: props.showNotification ?? vi.fn(),
  });

  return (
    <div>
      <span data-testid="is-syncing">{String(hook.isSyncing)}</span>
      <span data-testid="progress">{`${hook.syncProgress.current}/${hook.syncProgress.total}`}</span>
      <button type="button" onClick={() => void hook.syncCard('card-1', 'Deck')}>sync-one</button>
      <button type="button" onClick={() => void hook.syncCards()}>sync-all</button>
    </div>
  );
}

describe('useAnkiSync', () => {
  beforeEach(() => {
    mocks.checkConnection.mockReset();
    mocks.syncToAnki.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('opens settings instead of syncing when AnkiConnect is unavailable', async () => {
    const onOpenSettings = vi.fn();
    const onUpdateCardSyncStatus = vi.fn();
    const showNotification = vi.fn();
    mocks.checkConnection.mockResolvedValue(false);

    render(
      <Probe
        cards={[makeCard()]}
        onOpenSettings={onOpenSettings}
        onUpdateCardSyncStatus={onUpdateCardSyncStatus}
        showNotification={showNotification}
      />,
    );

    fireEvent.click(screen.getByText('sync-one'));

    await waitFor(() => {
      expect(onOpenSettings).toHaveBeenCalledOnce();
    });

    expect(mocks.syncToAnki).not.toHaveBeenCalled();
    expect(onUpdateCardSyncStatus).not.toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalledWith('Could not connect to Anki. Please check your AnkiConnect settings and ensure Anki is running.');
  });

  it('syncs a single card, updates status, and auto-deletes on success', async () => {
    const onDeleteCard = vi.fn(async () => {});
    const onUpdateCardSyncStatus = vi.fn();
    const showNotification = vi.fn();
    mocks.checkConnection.mockResolvedValue(true);
    mocks.syncToAnki.mockImplementation(async (_url, _deckName, _noteType, _cards, _tags, onProgress) => {
      onProgress(1, 1);
      return { attempted: 1, succeededIds: ['card-1'], failed: [] };
    });

    render(
      <Probe
        cards={[makeCard()]}
        autoDeleteSynced={true}
        onDeleteCard={onDeleteCard}
        onUpdateCardSyncStatus={onUpdateCardSyncStatus}
        showNotification={showNotification}
      />,
    );

    fireEvent.click(screen.getByText('sync-one'));

    await waitFor(() => {
      expect(onDeleteCard).toHaveBeenCalledWith('card-1');
    });

    expect(onUpdateCardSyncStatus).toHaveBeenNthCalledWith(1, 'card-1', 'syncing');
    expect(onUpdateCardSyncStatus).toHaveBeenNthCalledWith(2, 'card-1', 'synced');
    expect(showNotification).toHaveBeenCalledWith('Synced 1 card(s) to Deck');
    expect(screen.getByTestId('progress').textContent).toBe('1/1');
  });

  it('handles partial bulk sync failures and resets overlay state after completion', async () => {
    const onUpdateCardSyncStatus = vi.fn();
    const showNotification = vi.fn();
    mocks.checkConnection.mockResolvedValue(true);
    mocks.syncToAnki.mockImplementation(async (_url, _deckName, _noteType, cards, _tags, onProgress, onCardSynced) => {
      onProgress(1, cards.length);
      await onCardSynced?.('card-1');
      onProgress(2, cards.length);
      return {
        attempted: 2,
        succeededIds: ['card-1'],
        failed: [{ id: 'card-2', reason: 'duplicate note' }],
      };
    });

    render(
      <Probe
        cards={[makeCard(), makeCard({ id: 'card-2', audioRef: 'audio-2' })]}
        onUpdateCardSyncStatus={onUpdateCardSyncStatus}
        showNotification={showNotification}
      />,
    );

    fireEvent.click(screen.getByText('sync-all'));

    await waitFor(() => {
      expect(screen.getByTestId('is-syncing').textContent).toBe('false');
    });

    expect(onUpdateCardSyncStatus).toHaveBeenCalledWith('card-1', 'syncing');
    expect(onUpdateCardSyncStatus).toHaveBeenCalledWith('card-2', 'syncing');
    expect(onUpdateCardSyncStatus).toHaveBeenCalledWith('card-1', 'synced');
    expect(onUpdateCardSyncStatus).toHaveBeenCalledWith('card-2', 'unsynced');
    expect(showNotification).toHaveBeenCalledWith('Synced 1 card(s) to Deck');
    expect(showNotification).toHaveBeenCalledWith('Sync completed with 1 failure(s).\n- card-2: duplicate note');
    expect(screen.getByTestId('progress').textContent).toBe('0/0');
  });

  it('blocks overlapping sync triggers while a bulk sync is running', async () => {
    const showNotification = vi.fn();
    let resolveBulkSync: ((value: { attempted: number; succeededIds: string[]; failed: { id: string; reason: string }[] }) => void) | null = null;
    mocks.checkConnection.mockResolvedValue(true);
    mocks.syncToAnki.mockImplementation(async () => {
      return await new Promise((resolve) => {
        resolveBulkSync = resolve;
      });
    });

    render(
      <Probe
        cards={[makeCard()]}
        showNotification={showNotification}
      />,
    );

    fireEvent.click(screen.getByText('sync-all'));
    fireEvent.click(screen.getByText('sync-one'));

    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith('Sync is already in progress.');
    });

    expect(mocks.checkConnection).toHaveBeenCalledTimes(1);

    resolveBulkSync?.({ attempted: 1, succeededIds: ['card-1'], failed: [] });
    await waitFor(() => {
      expect(screen.getByTestId('is-syncing').textContent).toBe('false');
    });
  });
});

