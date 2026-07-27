import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModel(modelName) {
  try {
    console.log(`Testing ${modelName}...`);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Hello world",
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Aoede"
            }
          }
        }
      }
    });
    console.log(`Success with ${modelName}! AUDIO returned.`);
  } catch (e) {
    console.error(`Failed ${modelName}:`, e.message);
  }
}

async function run() {
  await testModel('gemini-2.5-flash-preview-tts');
  await testModel('gemini-3.1-flash-tts-preview');
}
run();
