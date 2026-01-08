import { GoogleGenAI, Type } from "@google/genai";

export interface LLMSettings {
  provider: 'gemini' | 'openai-compatible' | 'chrome-ai';
  apiKey: string;
  model: string;
  autoAnalyze: boolean;
  baseUrl?: string;
}

/**
 * Initializes the Google GenAI client using the environment variable API key.
 */
const getClient = (apiKeyOverride?: string) => {
  const apiKey = apiKeyOverride || process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

/**
 * Structure of the response expected from the AI model.
 */
export interface AnalysisResult {
  translation: string;
  notes: string;
  keyWords: string[];
}

/**
 * Sends a subtitle text to the Gemini model for analysis.
 * 
 * It asks for:
 * 1. A translation.
 * 2. Grammatical/cultural notes.
 * 3. Key vocabulary.
 * 
 * It uses Structured Output (JSON schema) to ensure a consistent return format.
 * 
 * @param text - The target subtitle text
 * @param contextPrev - The preceding line for context
 * @param contextNext - The following line for context
 * @param settings - Optional settings for the LLM configuration
 * @returns Parsed AnalysisResult
 */
export const analyzeSubtitle = async (
  text: string, 
  contextPrev: string = "", 
  contextNext: string = "",
  settings?: LLMSettings
): Promise<AnalysisResult> => {
  try {
    const apiKey = settings?.provider === 'gemini' && settings.apiKey ? settings.apiKey : undefined;
    const ai = getClient(apiKey);
    
    // Use model from settings or default to gemini-3-flash-preview as per guidelines for basic text tasks
    const modelName = settings?.model || "gemini-3-flash-preview";

    const prompt = `
      Analyze the following subtitle line from a video. 
      Target Line: "${text}"
      Context Before: "${contextPrev}"
      Context After: "${contextNext}"

      Please provide:
      1. A natural translation (into English, or if input is English, into Spanish).
      2. Brief grammatical notes or nuance explanation.
      3. A list of key vocabulary words found in the line.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: { type: Type.STRING, description: "Natural translation of the target line" },
            notes: { type: Type.STRING, description: "Short grammar or cultural notes" },
            keyWords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of important words in the original form" 
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("No response text");

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return a fallback error object so the UI doesn't crash
    return {
      translation: "Error generating translation.",
      notes: "Could not analyze.",
      keyWords: []
    };
  }
};