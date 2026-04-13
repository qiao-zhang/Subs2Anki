import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import CardItem from '../../components/CardItem.tsx';
import {AnkiCard} from '../../services/types.ts';

vi.mock('../../services/db.ts', () => ({
  getMedia: vi.fn().mockImplementation((id) => {
    if (id === 'mock-screenshot-id') {
      return Promise.resolve('data:image/png;base64,fake');
    }
    return Promise.resolve(null);
  })
}));

/**
 * Test Suite for CardItem Component.
 *
 * Verifies:
 * 1. UI Rendering: Correct text, images, and timestamps are displayed.
 * 2. Conditional Rendering: Placeholders appear when data is missing.
 * 3. User Interaction: Buttons trigger the correct prop callbacks.
 */
describe('CardItem Component', () => {
  // Standard Mock Data used across tests
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
  };

  // Mock callback functions
  const mockDelete = vi.fn();
  const mockPreview = vi.fn();
  const mockSync = vi.fn();

  it('renders card content correctly', async () => {
    render(
      <CardItem
        card={mockCard}
        onDelete={mockDelete}
        onPreview={mockPreview}
        onSyncCard={mockSync}
        isConnected
      />
    );

    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('Hola Mundo')).toBeInTheDocument();
    expect(screen.getByText('A greeting')).toBeInTheDocument();
    expect(screen.getByText('00:05')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByAltText('Snapshot')).toBeInTheDocument();
    });
  });

  it('renders placeholder when translation is missing', () => {
    const emptyCard: AnkiCard = { ...mockCard, translation: '', notes: '', screenshotRef: null };
    render(
      <CardItem
        card={emptyCard}
        onDelete={mockDelete}
        onPreview={mockPreview}
        onSyncCard={mockSync}
      />
    );

    expect(screen.getByText('Double-click to preview')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const cardWithoutScreenshot: AnkiCard = {...mockCard, screenshotRef: null};
    render(
      <CardItem
        card={cardWithoutScreenshot}
        onDelete={mockDelete}
        onPreview={mockPreview}
        onSyncCard={mockSync}
      />
    );

    const deleteBtn = screen.getByTitle('deleteCard');
    fireEvent.click(deleteBtn);

    expect(mockDelete).toHaveBeenCalledWith('123');
  });

  it('calls onPreview when double clicked', () => {
    const cardWithoutScreenshot: AnkiCard = {...mockCard, screenshotRef: null};
    render(
      <CardItem
        card={cardWithoutScreenshot}
        onDelete={mockDelete}
        onPreview={mockPreview}
        onSyncCard={mockSync}
      />
    );

    fireEvent.doubleClick(screen.getByText('Hello World'));
    expect(mockPreview).toHaveBeenCalledWith(cardWithoutScreenshot);
  });

});
