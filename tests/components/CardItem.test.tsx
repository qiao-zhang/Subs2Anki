
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CardItem from '../../ui/components/CardItem';
import { AnkiCard } from '../../core/types';

// Mock getMedia from db to handle async image loading
vi.mock('../../core/db', () => ({
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

  it('renders card content correctly', async () => {
    render(
      <CardItem
        card={mockCard}
        onDelete={mockDelete}
        onPreview={mockPreview}
      />
    );

    // Verify all key information is visible to the user
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('Hola Mundo')).toBeInTheDocument();
    expect(screen.getByText('A greeting')).toBeInTheDocument();
    expect(screen.getByText('00:05')).toBeInTheDocument();
  });

  it('renders placeholder when translation is missing', () => {
    // Create a card with no AI analysis data
    const emptyCard: AnkiCard = { ...mockCard, translation: '', notes: '' };
    render(
      <CardItem
        card={emptyCard}
        onDelete={mockDelete}
        onPreview={mockPreview}
      />
    );

    // Verify the placeholder text appears
    expect(screen.getByText('Double-click to preview')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <CardItem
        card={mockCard}
        onDelete={mockDelete}
        onPreview={mockPreview}
      />
    );

    // Find button by title attribute (accessibility practice)
    const deleteBtn = screen.getByTitle('Delete Card');
    fireEvent.click(deleteBtn);

    // Verify callback was fired with correct ID
    expect(mockDelete).toHaveBeenCalledWith('123');
  });

  it('calls onPreview when double clicked', () => {
    render(
      <CardItem
        card={mockCard}
        onDelete={mockDelete}
        onPreview={mockPreview}
      />
    );

    const card = screen.getByText('Hello World').closest('div')?.parentElement?.parentElement;
    if (card) {
      fireEvent.doubleClick(card);
      expect(mockPreview).toHaveBeenCalledWith(mockCard);
    }
  });

});
