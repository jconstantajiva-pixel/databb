
import { GoogleGenAI, Type } from "@google/genai";
import { Contact, AIInsight } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeContacts = async (contacts: Contact[]): Promise<AIInsight> => {
  if (contacts.length === 0) {
    return { summary: "Nu există contacte de analizat.", suggestions: [] };
  }

  const ai = getAIClient();
  const contactData = contacts.map(c => `Nume: ${c.name}, Adresă: ${c.address}`).join("\n");

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analizează următoarea listă de contacte și oferă un rezumat scurt în limba română (o singură frază) despre distribuția lor sau calitatea datelor, plus 3 sugestii pentru a îmbunătăți evidența: \n\n${contactData}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["summary", "suggestions"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { summary: "Eroare la procesarea AI.", suggestions: [] };
  }
};
