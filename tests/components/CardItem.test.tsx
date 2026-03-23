/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CardItem from '../../components/CardItem.tsx';
import { AnkiCard } from '../../services/types.ts';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

vi.mock('../../services/db.ts', () => ({
  getMedia: vi.fn().mockImplementation((id: string) => {
    if (id === 'mock-screenshot-id') {
      return Promise.resolve('data:image/png;base64,fake');
    }
    return Promise.resolve(null);
  })
}));

describe('CardItem Component', () => {
  const mockCard: AnkiCard = {
    id: '123',
    subtitleId: 1,
    text: 'Hello World',
    translation: 'Hola Mundo',
    notes: 'A greeting',
    screenshotRef: 'mock-screenshot-id',
    audioRef: null,
    timestampStr: '00:05',
    audioStatus: 'done',
    syncStatus: 'unsynced',
  };

  const mockDelete = vi.fn();
  const mockPreview = vi.fn();
  const mockSync = vi.fn();

  beforeEach(() => {
    mockDelete.mockReset();
    mockPreview.mockReset();
    mockSync.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders card content correctly', async () => {
    render(
      <CardItem
        card={mockCard}
        onDelete={mockDelete}
        onPreview={mockPreview}
        onSyncCard={mockSync}
        isConnected={true}
      />
    );

    expect(screen.getByText('Hello World')).toBeTruthy();
    expect(screen.getByText('Hola Mundo')).toBeTruthy();
    expect(screen.getByText('A greeting')).toBeTruthy();
    expect(screen.getByText('00:05')).toBeTruthy();
  });

  it('renders placeholder when translation and notes are missing', () => {
    const emptyCard: AnkiCard = { ...mockCard, translation: '', notes: '' };
    render(
      <CardItem
        card={emptyCard}
        onDelete={mockDelete}
        onPreview={mockPreview}
        onSyncCard={mockSync}
      />
    );

    expect(screen.getByText('Double-click to preview')).toBeTruthy();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <CardItem
        card={mockCard}
        onDelete={mockDelete}
        onPreview={mockPreview}
        onSyncCard={mockSync}
      />
    );

    const deleteBtn = screen.getByTitle('deleteCard');
    fireEvent.click(deleteBtn);

    expect(mockDelete).toHaveBeenCalledWith('123');
  });

  it('calls onPreview when the card is double clicked', () => {
    const { container } = render(
      <CardItem
        card={mockCard}
        onDelete={mockDelete}
        onPreview={mockPreview}
        onSyncCard={mockSync}
      />
    );

    const cardRoot = container.firstElementChild;
    expect(cardRoot).toBeTruthy();
    if (cardRoot) {
      fireEvent.doubleClick(cardRoot);
    }

    expect(mockPreview).toHaveBeenCalledWith(mockCard);
  });
});
