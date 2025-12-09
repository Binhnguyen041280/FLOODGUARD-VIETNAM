import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DIYGuide } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file to Base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeFloodImage = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const prompt = `
      Analyze this image for flood conditions in Vietnam for a rescue application.
      
      1. Water Analysis: Estimate depth (e.g., "0.5m"), risk level (High/Medium/Low).
      2. Object Detection: Identify standard objects (House, Motorbike).
      3. **CRITICAL - Vulnerable People Detection**: Look specifically for 'Elderly' (Người già), 'Children/Baby' (Trẻ em), 'Pregnant' (Phụ nữ mang thai), or 'Disabled' (Người khuyết tật). List them in the 'vulnerablePeople' field.
      4. Advice: Provide brief, urgent safety advice in Vietnamese.

      Rules:
      - Risk 'High': Depth > 1m, fast current, or presence of vulnerable people in water.
      - Risk 'Medium': Depth 0.3m - 1m.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            depth: { type: Type.STRING, description: "Estimated water depth" },
            risk: { type: Type.STRING, enum: ["High", "Medium", "Low"], description: "Risk level" },
            objectsDetected: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "General objects seen" 
            },
            vulnerablePeople: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific list of vulnerable groups found (e.g., Elderly, Child)"
            },
            advice: { type: Type.STRING, description: "Safety advice in Vietnamese" }
          },
          required: ["depth", "risk", "objectsDetected", "vulnerablePeople", "advice"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback for demo
    return {
      depth: "Unknown",
      risk: "Low",
      objectsDetected: ["Analysis Failed"],
      vulnerablePeople: [],
      advice: "Could not analyze image. Please proceed with caution."
    };
  }
};

// NEW: DIY Rescue Guide Generation
export const generateDIYGuide = async (base64Image: string, mimeType: string): Promise<DIYGuide> => {
  try {
    const prompt = `
      You are a survival expert. Analyze the image to identify available objects (e.g., plastic bottles, jerry cans, wood, styrofoam, rope, plastic bags).
      
      Suggest a CREATIVE solution to build a simple flotation device or rescue gear (life vest, raft) using ONLY these items.
      
      Return JSON:
      - title: Name of the creation (Vietnamese).
      - materialsDetected: List of items seen.
      - steps: Short, clear step-by-step instructions in Vietnamese.
      - safetyNote: Critical warning.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            materialsDetected: { type: Type.ARRAY, items: { type: Type.STRING } },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            safetyNote: { type: Type.STRING }
          },
          required: ["title", "materialsDetected", "steps", "safetyNote"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as DIYGuide;

  } catch (error) {
    console.error("DIY Analysis Failed:", error);
    return {
      title: "Không thể phân tích",
      materialsDetected: [],
      steps: ["Vui lòng thử chụp lại rõ hơn các vật dụng bạn có."],
      safetyNote: "Luôn ưu tiên tìm nơi cao ráo."
    };
  }
};
