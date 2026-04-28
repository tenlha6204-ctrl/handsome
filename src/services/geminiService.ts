import { GoogleGenAI, Type } from "@google/genai";
import { FaceAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeFace(imageBase64: string): Promise<FaceAnalysis> {
  const prompt = "Perform a geometric and aesthetic analysis of this face. Provide a rating out of 10. Breakdown the following metrics: Symmetry, Skin Clarity, Proportions, Harmony. List 3 key features. Write a short 'honest critique'. Suggest the 'best angle' for a photo.";

  const result = await ai.models.generateContent({
    model: "gemini-flash-latest",
    config: {
      systemInstruction: "You are an objective, honest, and professional aesthetic analyzer. You provide clinical evaluations of facial acoustics and geometry. You must return a valid JSON object. Be truthful even if the rating is low, avoiding generic flattery. If no face is detected, provide a rating of 0 and note it in the critique.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rating: { type: Type.NUMBER },
          breakdown: {
            type: Type.OBJECT,
            properties: {
              symmetry: { type: Type.NUMBER },
              skinClarity: { type: Type.NUMBER },
              proportions: { type: Type.NUMBER },
              harmony: { type: Type.NUMBER },
            },
            required: ["symmetry", "skinClarity", "proportions", "harmony"],
          },
          keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
          honestCritique: { type: Type.STRING },
          bestAngle: { type: Type.STRING },
        },
        required: ["rating", "breakdown", "keyFeatures", "honestCritique", "bestAngle"],
      },
    },
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64,
          },
        },
      ],
    },
  });

  const text = result.text;
  if (!text) {
    throw new Error("No analysis data received. Please try again with a clearer photo.");
  }

  // Clean up potential markdown marks if the model didn't strictly follow responseMimeType
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const cleanJson = jsonMatch ? jsonMatch[0] : text;
  
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse AI response:", text);
    throw new Error("Could not interpret AI analysis. Please try again.");
  }
}
