
import { GoogleGenAI, Type } from "@google/genai";
import { Contact, AIInsight } from "../types";

const getAIClient = () => {
  // Verificăm dacă process.env există pentru a evita prăbușirea în browser
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : '';
  
  if (!apiKey) {
    console.warn("API_KEY nu este definită. Analiza AI va fi indisponibilă.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeContacts = async (contacts: Contact[]): Promise<AIInsight> => {
  if (contacts.length === 0) {
    return { summary: "Nu există contacte de analizat.", suggestions: [] };
  }

  const ai = getAIClient();
  if (!ai) {
    return { 
      summary: "Funcția AI necesită o cheie validă configurată pe server.", 
      suggestions: ["Configurează API_KEY pe Render", "Verifică setările de mediu"] 
    };
  }

  const contactData = contacts.map(c => `Nume: ${c.name}, Adresă: ${c.address}`).join("\n");

  try {
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

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { summary: "Analiza AI a întâmpinat o eroare temporară.", suggestions: ["Reîncearcă mai târziu"] };
  }
};
