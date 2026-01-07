import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export interface AnalysisResult {
  translation: string;
  notes: string;
  keyWords: string[];
}

export const analyzeSubtitle = async (
  text: string, 
  contextPrev: string = "", 
  contextNext: string = ""
): Promise<AnalysisResult> => {
  try {
    const ai = getClient();
    
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
      model: "gemini-2.5-flash",
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
    return {
      translation: "Error generating translation.",
      notes: "Could not analyze.",
      keyWords: []
    };
  }
};