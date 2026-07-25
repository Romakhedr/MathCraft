import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const lastMessage = messages[messages.length - 1]?.content || "مرحباً";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: lastMessage,
    });

    return res.status(200).json({ text: response.text });
  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ error: "Failed to fetch AI response" });
  }
}
