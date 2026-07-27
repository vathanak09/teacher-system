import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: "Hello world",
    config: {
      responseModalities: ["AUDIO"],
    }
  });
  
  const inlineData = response.candidates[0].content.parts[0].inlineData;
  console.log("Mime type:", inlineData.mimeType);
  console.log("Base64 string length:", inlineData.data.length);
}
run();
