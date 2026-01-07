import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CardItem from '../../ui/components/CardItem';
import { AnkiCard } from '../../core/types';

describe('CardItem Component', () => {
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

    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('Hola Mundo')).toBeInTheDocument();
    expect(screen.getByText('A greeting')).toBeInTheDocument();
    expect(screen.getByText('00:05')).toBeInTheDocument();
  });

  it('renders placeholder when translation is missing', () => {
    const emptyCard = { ...mockCard, translation: '', notes: '' };
    render(
      <CardItem 
        card={emptyCard} 
        onDelete={mockDelete} 
        onAnalyze={mockAnalyze} 
        isAnalyzing={false} 
      />
    );

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

    const deleteBtn = screen.getByTitle('Delete Card');
    fireEvent.click(deleteBtn);
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
    expect(mockAnalyze).toHaveBeenCalledWith(mockCard);
  });

  it('disables analyze button when isAnalyzing is true', () => {
    render(
      <CardItem 
        card={mockCard} 
        onDelete={mockDelete} 
        onAnalyze={mockAnalyze} 
        isAnalyzing={true} 
      />
    );

    const analyzeBtn = screen.getByTitle('AI Analyze');
    expect(analyzeBtn).toBeDisabled();
  });
});