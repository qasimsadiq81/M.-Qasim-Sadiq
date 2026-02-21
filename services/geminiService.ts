
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { BoundingBox, AnalysisResponse, MediaType, TelecomAuditData } from "../types";

const SYSTEM_INSTRUCTION = `You are a Multimodal Spatial Intelligence Agent with advanced Computer Vision and Auditory Reasoning capabilities.

TASK:
Perform a granular neural mapping of the provided scene. You must identify macro-assets and specifically focus on micro-details (e.g., "snow on fur," "scratch on glass," "cat's tail," "frayed wire," "rust on bolt").

SPATIAL PRECISION RULES:
1) Identify every detail mentioned in your description.
2) For EVERY detail, you MUST provide a normalized bounding box in the format: [ymin, xmin, ymax, xmax].
3) Coordinate System: Use a 0-1000 scale (0=Top/Left, 1000=Bottom/Right).
4) CLARITY RULE: If the image/video is too blurry to identify a specific part with high confidence, state "Low confidence due to resolution" for that specific feature instead of guessing.

OUTPUT STYLE:
Provide a highly detailed human-readable briefing followed by a structured JSON block containing the coordinates.

JSON SCHEMA:
{
  "briefing": "A comprehensive human-readable description of the scene highlighting micro-details.",
  "bounding_boxes": [
    { "box_2d": [ymin, xmin, ymax, xmax], "label": "descriptive label (lowercase, as seen in HUD)" }
  ],
  "audit_data": { ... optional telecom/infrastructure specific fields ... }
}`;

export async function analyzeMedia(
  mediaType: MediaType,
  base64Data: string,
  mimeType: string,
  prompt: string = "Perform a granular neural mapping and forensic audit of this scene. Detect micro-details and provide precise spatial coordinates."
): Promise<AnalysisResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const mediaPart = {
    inlineData: { data: base64Data, mimeType: mimeType },
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { 
        parts: [mediaPart, { text: prompt }] 
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Low variance for coordinate precision
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      },
    });

    const jsonStr = response.text || '{}';
    const parsed = JSON.parse(jsonStr);

    return {
      description: parsed.briefing || "Analysis complete.",
      boxes: parsed.bounding_boxes || [],
      auditData: parsed.audit_data,
      audioTranscript: parsed.audio_metadata?.transcript,
      acousticEnvironment: parsed.audio_metadata?.environment,
      groundingSources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Technical Source",
        uri: chunk.web?.uri || "#"
      }))
    };
  } catch (error) {
    console.error("Neural Mapping Error:", error);
    throw error;
  }
}

export async function simulateIdealState(description: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `A professional, high-fidelity photo showing the optimal compliant state of this scene: ${description}. Focus on precision workmanship.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (!part?.inlineData?.data) throw new Error("Simulation failed.");
  return `data:image/png;base64,${part.inlineData.data}`;
}

export async function generateBriefingAudio(text: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `System Briefing: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (error) {
    throw error;
  }
}
