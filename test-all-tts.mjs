import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModel(modelName) {
  try {
    process.stdout.write(`Testing ${modelName}... `);
    await ai.models.generateContent({
      model: modelName,
      contents: "Hello",
      config: { responseModalities: ["AUDIO"] }
    });
    console.log("✅ WORKS");
  } catch (e) {
    console.log("❌ FAILED: " + e.message);
  }
}

async function run() {
  const models = [
    'gemini-2.5-flash-preview-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-2.0-flash-exp',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite-001',
    'gemini-2.0-flash-lite',
    'gemini-3.1-flash-lite-preview',
    'gemini-3.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];
  for (const m of models) {
    await testModel(m);
  }
}
run();
