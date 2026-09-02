import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { firebaseConfig } from "../firebase/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || firebaseConfig.apiKey);

const schema: any = {
  description: "Extract player information from a BGMI profile screenshot",
  type: SchemaType.OBJECT,
  properties: {
    ign: {
      type: SchemaType.STRING,
      description: "The player In-Game Name (IGN)",
    },
    uid: {
      type: SchemaType.STRING,
      description: "The player User ID (UID)",
    },
  },
  required: ["ign", "uid"],
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

export async function extractProfileDataSdk(base64Image: string) {
    // Detect mime type from base64 if possible
    let mimeType = 'image/jpeg';
    if (base64Image.startsWith('iVBORw0KGgo')) mimeType = 'image/png';
    else if (base64Image.startsWith('R0lGODlh')) mimeType = 'image/gif';
    else if (base64Image.startsWith('UklGR')) mimeType = 'image/webp';

    const parts = [
        {
            inlineData: {
                data: base64Image,
                mimeType
            }
        },
        { text: "Extract the BGMI (Battlegrounds Mobile India) In-Game Name (IGN) and User ID (UID) from this player profile screenshot. Return only the JSON object with 'ign' and 'uid' keys." }
    ];

    try {
        const result = await model.generateContent(parts);
        const text = result.response.text();
        if (!text) throw new Error("Empty response from AI");
        
        return JSON.parse(text) as { ign: string; uid: string };
    } catch (error: any) {
        console.error("AI Extraction Error:", error);
        throw new Error(`AI Extraction Failed: ${error.message || 'Unknown error'}`);
    }
}
