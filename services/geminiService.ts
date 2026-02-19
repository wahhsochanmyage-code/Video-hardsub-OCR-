
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SubtitleEntry, OCRLanguage } from "../types";

const OCR_PROMPT = (language: string) => `
OBJECTIVE: Extract all hard-coded subtitles/captions from the provided sequence of video frames.
LANGUAGE PRIORITY: ${language}.

INSTRUCTIONS:
1. Examine EVERY frame carefully for text.
2. Record every unique line of dialogue or caption. 
3. PRECISE TIMING: For each line, determine exactly which frame it FIRST appears in and which frame it LAST remains visible in.
4. SHORT DIALOGUE: Do not miss short phrases like "Yes", "No", "Look!", or single-word exclamations.
5. MULTIPLE LINES: If multiple characters speak at once and subtitles show multiple lines, preserve all of them in a single "text" block, separated by a newline.
6. CHARACTER LINES: Ensure distinct lines from different characters are captured sequentially.
7. OMIT: Ignore watermarks, station logos, or background signs that are not part of the hard-subtitles.

OUTPUT FORMAT: Return a JSON array of objects with keys: "text", "startTime", "endTime".
Example: [{"text": "Hello, how are you?", "startTime": 12.5, "endTime": 14.2}]
`;

export class GeminiOCRService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async processFrames(
    frames: { data: string; timestamp: number }[],
    language: OCRLanguage
  ): Promise<SubtitleEntry[]> {
    if (!process.env.API_KEY) {
      throw new Error("API Key is missing. Check your environment settings.");
    }

    try {
      const parts = frames.map(f => ({
        inlineData: {
          mimeType: 'image/jpeg',
          data: f.data.split(',')[1]
        }
      }));

      // We provide the model with exact timestamps for each frame in the batch
      const frameContext = `BATCH METADATA (Timestamps): [${frames.map(f => f.timestamp.toFixed(2)).join('s, ')}s]`;
      
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Pro model for maximum accuracy on small text and brief lines
        contents: {
          parts: [
            ...parts,
            { text: `${OCR_PROMPT(language)}\n\n${frameContext}` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The exact dialogue text captured" },
                startTime: { type: Type.NUMBER, description: "Exact start time in seconds based on batch metadata" },
                endTime: { type: Type.NUMBER, description: "Exact end time in seconds based on batch metadata" }
              },
              required: ["text", "startTime", "endTime"]
            }
          }
        }
      });

      const text = response.text || '[]';
      const results = JSON.parse(text);

      return results.map((r: any, idx: number) => ({
        id: `sub-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        text: r.text,
        startTime: parseFloat(r.startTime),
        endTime: parseFloat(r.endTime)
      }));
    } catch (error) {
      console.error("Gemini High-Precision OCR Error:", error);
      throw error;
    }
  }
}

export const ocrService = new GeminiOCRService();
