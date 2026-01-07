import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CardItem from '../../ui/components/CardItem';
import { AnkiCard } from '../../core/types';

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
    screenshotDataUrl: 'data:image/png;base64,fake',
    audioBlob: null,
    timestampStr: '00:05'
  };

  // Mock callback functions
  const mockDelete = vi.fn();
  const mockAnalyze = vi.fn();

  it('renders card content correctly', () => {
    render(
      <CardItem 
        card={mockCard} 
        onDelete={mockDelete} 
        onAnalyze={mockAnalyze} 
        isAnalyzing={false} 
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
    const emptyCard = { ...mockCard, translation: '', notes: '' };
    render(
      <CardItem 
        card={emptyCard} 
        onDelete={mockDelete} 
        onAnalyze={mockAnalyze} 
        isAnalyzing={false} 
      />
    );

    // Verify the placeholder text appears
    expect(screen.getByText('No analysis data yet.')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <CardItem 
        card={mockCard} 
        onDelete={mockDelete} 
        onAnalyze={mockAnalyze} 
        isAnalyzing={false} 
      />
    );

    // Find button by title attribute (accessibility practice)
    const deleteBtn = screen.getByTitle('Delete Card');
    fireEvent.click(deleteBtn);
    
    // Verify callback was fired with correct ID
    expect(mockDelete).toHaveBeenCalledWith('123');
  });

  it('calls onAnalyze when analyze button is clicked', () => {
    render(
      <CardItem 
        card={mockCard} 
        onDelete={mockDelete} 
        onAnalyze={mockAnalyze} 
        isAnalyzing={false} 
      />
    );

    const analyzeBtn = screen.getByTitle('AI Analyze');
    fireEvent.click(analyzeBtn);
    
    // Verify callback was fired with the card object
    expect(mockAnalyze).toHaveBeenCalledWith(mockCard);
  });

  it('disables analyze button when isAnalyzing is true', () => {
    render(
      <CardItem 
        card={mockCard} 
        onDelete={mockDelete} 
        onAnalyze={mockAnalyze} 
        isAnalyzing={true} // Simulate loading state
      />
    );

    const analyzeBtn = screen.getByTitle('AI Analyze');
    // Verify button cannot be clicked again while loading
    expect(analyzeBtn).toBeDisabled();
  });
});