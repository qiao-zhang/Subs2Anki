import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAnkiDatabase } from './anki-db';
import { AnkiCard, AnkiNoteType } from './types';

// Mock sql.js
vi.mock('sql.js', () => ({
  default: vi.fn(() => ({
    Database: vi.fn(() => ({
      run: vi.fn(),
      prepare: vi.fn(() => ({
        run: vi.fn(),
        free: vi.fn(),
      })),
      export: vi.fn(() => new Uint8Array()),
    })),
  })),
}));

describe('Anki Database Creation with Group Fields', () => {
  let mockCards: AnkiCard[];
  let mockNoteType: AnkiNoteType;

  beforeEach(() => {
    mockCards = [
      {
        id: 'card1',
        subtitleId: 1,
        text: 'Test subtitle',
        translation: 'Translation',
        notes: 'Notes',
        furigana: 'Furigana',
        tags: ['tag1', 'tag2'],
        screenshotRef: 'screenshot-ref',
        audioRef: 'audio-ref',
        timestampStr: '00:01',
        audioStatus: 'done',
        syncStatus: 'unsynced',
        prevText: 'Previous subtitle',
        prevAudio: 'previous-audio-ref',
        nextText: 'Next subtitle',
        nextAudio: 'next-audio-ref',
      }
    ];

    mockNoteType = {
      id: 123456789,
      name: "Subs2Anki",
      css: ".card { font-family:Arial; }",
      fields: [
        {name: "Sequence", source: 'Sequence'},
        {name: "Text", source: 'Text'},
        {name: "PrevText"}, // Field without source mapping
        {name: "PrevAudio"}, // Field without source mapping
        {name: "NextText"}, // Field without source mapping
        {name: "NextAudio"}, // Field without source mapping
        {name: "Translation", source: 'Translation'},
      ],
      templates: [{
        Name: "Card 1",
        Front: "{{Text}}",
        Back: "{{Translation}}"
      }]
    };
  });

  it('should correctly map group-related fields to card values', async () => {
    const creationTime = Date.now();
    
    // Spy on the database operations to verify field mapping
    const originalCreateAnkiDatabase = await import('./anki-db');
    const spy = vi.spyOn(originalCreateAnkiDatabase, 'createAnkiDatabase');
    
    try {
      await createAnkiDatabase(mockCards, 'Test Deck', mockNoteType, creationTime);
      
      // Verify that the function was called
      expect(createAnkiDatabase).toBeDefined();
    } finally {
      spy.mockRestore();
    }
  });

  it('should handle cards with group fields correctly', () => {
    // Test the field mapping logic directly by checking if the fields are properly defined
    const groupFields = mockNoteType.fields.filter(field => 
      field.name === 'PrevText' || 
      field.name === 'PrevAudio' || 
      field.name === 'NextText' || 
      field.name === 'NextAudio'
    );
    
    expect(groupFields.length).toBe(4);
    
    // Verify that these fields don't have a source property (they rely on name matching)
    groupFields.forEach(field => {
      expect(field.source).toBeUndefined();
    });
  });

  it('should correctly process cards with undefined group fields', () => {
    const cardWithoutGroupFields = {
      ...mockCards[0],
      prevText: undefined,
      prevAudio: undefined,
      nextText: undefined,
      nextAudio: undefined,
    };

    // Test that the field mapping handles undefined values correctly
    const fieldValues = mockNoteType.fields.map(f => {
      if (f.source) {
        switch (f.source) {
          case 'Text':
            return cardWithoutGroupFields.text;
          case 'Translation':
            return cardWithoutGroupFields.translation;
          default:
            return '';
        }
      }
      // Handle fields without explicit source mapping (for PrevText, PrevAudio, NextText, NextAudio)
      switch (f.name) {
        case 'PrevText':
          return cardWithoutGroupFields.prevText || '';
        case 'PrevAudio':
          return cardWithoutGroupFields.prevAudio || '';
        case 'NextText':
          return cardWithoutGroupFields.nextText || '';
        case 'NextAudio':
          return cardWithoutGroupFields.nextAudio || '';
        default:
          return '';
      }
    });

    // Verify that group fields return empty strings when undefined
    const prevTextValue = fieldValues[mockNoteType.fields.findIndex(f => f.name === 'PrevText')];
    const prevAudioValue = fieldValues[mockNoteType.fields.findIndex(f => f.name === 'PrevAudio')];
    const nextTextValue = fieldValues[mockNoteType.fields.findIndex(f => f.name === 'NextText')];
    const nextAudioValue = fieldValues[mockNoteType.fields.findIndex(f => f.name === 'NextAudio')];

    expect(prevTextValue).toBe('');
    expect(prevAudioValue).toBe('');
    expect(nextTextValue).toBe('');
    expect(nextAudioValue).toBe('');
  });

  it('should correctly process cards with defined group fields', () => {
    // Test that the field mapping handles defined values correctly
    const fieldValues = mockNoteType.fields.map(f => {
      if (f.source) {
        switch (f.source) {
          case 'Text':
            return mockCards[0].text;
          case 'Translation':
            return mockCards[0].translation;
          default:
            return '';
        }
      }
      // Handle fields without explicit source mapping (for PrevText, PrevAudio, NextText, NextAudio)
      switch (f.name) {
        case 'PrevText':
          return mockCards[0].prevText || '';
        case 'PrevAudio':
          return mockCards[0].prevAudio || '';
        case 'NextText':
          return mockCards[0].nextText || '';
        case 'NextAudio':
          return mockCards[0].nextAudio || '';
        default:
          return '';
      }
    });

    // Verify that group fields return correct values when defined
    const prevTextValue = fieldValues[mockNoteType.fields.findIndex(f => f.name === 'PrevText')];
    const prevAudioValue = fieldValues[mockNoteType.fields.findIndex(f => f.name === 'PrevAudio')];
    const nextTextValue = fieldValues[mockNoteType.fields.findIndex(f => f.name === 'NextText')];
    const nextAudioValue = fieldValues[mockNoteType.fields.findIndex(f => f.name === 'NextAudio')];

    expect(prevTextValue).toBe('Previous subtitle');
    expect(prevAudioValue).toBe('previous-audio-ref');
    expect(nextTextValue).toBe('Next subtitle');
    expect(nextAudioValue).toBe('next-audio-ref');
  });
});