import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeSubtitle } from '../../core/gemini';

/**
 * Test Suite for Gemini AI Service.
 * 
 * Uses Mocks to prevent real API calls during testing.
 * Verifies:
 * 1. Correct Prompt construction and API calling.
 * 2. Parsing of JSON responses.
 * 3. Graceful error handling when API fails.
 */

// --- Mock Setup ---
const mockGenerateContent = vi.fn();

// We mock the entire @google/genai module
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent
      }
    })),
    // Mock the Type enum used in schema definition
    Type: {
        OBJECT: 'OBJECT',
        STRING: 'STRING',
        ARRAY: 'ARRAY'
    }
  };
});

describe('Gemini Service', () => {
  // Reset mocks and environment before each test to ensure isolation
  beforeEach(() => {
    process.env.API_KEY = 'test-key';
    vi.clearAllMocks();
  });

  it('returns parsed analysis result on success', async () => {
    // Define the expected mock data
    const mockResponse = {
      translation: 'Hola Mundo',
      notes: 'Standard greeting',
      keyWords: ['Hola', 'Mundo']
    };

    // Simulate a successful JSON response from the LLM
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(mockResponse)
    });

    const result = await analyzeSubtitle('Hello World');

    // Assert the function returns the parsed object
    expect(result).toEqual(mockResponse);
    
    // Assert the API was called with the correct parameters (schema, content)
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.stringContaining('Hello World'),
      config: expect.objectContaining({
        responseMimeType: 'application/json'
      })
    }));
  });

  it('returns error fallback object when API fails', async () => {
    // Simulate a network or API error
    mockGenerateContent.mockRejectedValueOnce(new Error('API Error'));

    const result = await analyzeSubtitle('Hello World');

    // Should return a safe default object so the UI doesn't crash
    expect(result).toEqual({
      translation: "Error generating translation.",
      notes: "Could not analyze.",
      keyWords: []
    });
  });
});