import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeSubtitle } from '../../core/gemini';

// Mock the @google/genai library
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent
      }
    })),
    Type: {
        OBJECT: 'OBJECT',
        STRING: 'STRING',
        ARRAY: 'ARRAY'
    }
  };
});

describe('Gemini Service', () => {
  beforeEach(() => {
    process.env.API_KEY = 'test-key';
    vi.clearAllMocks();
  });

  it('returns parsed analysis result on success', async () => {
    const mockResponse = {
      translation: 'Hola Mundo',
      notes: 'Standard greeting',
      keyWords: ['Hola', 'Mundo']
    };

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(mockResponse)
    });

    const result = await analyzeSubtitle('Hello World');

    expect(result).toEqual(mockResponse);
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.stringContaining('Hello World'),
      config: expect.objectContaining({
        responseMimeType: 'application/json'
      })
    }));
  });

  it('returns error fallback object when API fails', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('API Error'));

    const result = await analyzeSubtitle('Hello World');

    expect(result).toEqual({
      translation: "Error generating translation.",
      notes: "Could not analyze.",
      keyWords: []
    });
  });
});