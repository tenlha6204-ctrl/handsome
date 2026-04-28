import { GoogleGenAI, Type } from "@google/genai";
import { FaceAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeFace(imageBase64: string): Promise<FaceAnalysis> {
  const prompt = "Analyze this face. Provide a rating out of 10 (decimal allowed), a breakdown of symmetry, skin clarity, proportions, and harmony (all 0-10), a list of 3-5 key features, an 'honest critique', and the 'best angle' for this face.";

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are an honest, objective aesthetic analyzer. You analyze facial symmetry, skin clarity, proportions, and overall harmony. You provide a rating out of 10. You must be truthful but professional. Avoid sugarcoating, but also avoid being needlessly mean.",
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

  const text = result.text || "";
  // Clean up potential markdown marks if the model didn't strictly follow responseMimeType
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const cleanJson = jsonMatch ? jsonMatch[0] : text;
  
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse AI response:", text);
    throw new Error("Invalid response format from AI");
  }
}
