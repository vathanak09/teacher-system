import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, voiceName = 'Aoede' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing in environment variables.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Call Gemini API to generate audio
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: text,
      config: {
        // We explicitly request AUDIO output modality
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName
            }
          }
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No response generated from Gemini API.");
    }

    const candidate = response.candidates[0];
    const parts = candidate.content?.parts;
    
    if (!parts || parts.length === 0 || !parts[0].inlineData) {
      throw new Error("No audio content returned from Gemini API. The response might have been blocked or empty.");
    }

    const audioBase64 = parts[0].inlineData.data;
    const mimeType = parts[0].inlineData.mimeType || 'audio/wav';
    
    return NextResponse.json({ audioBase64, mimeType });
  } catch (error: any) {
    console.error('Error generating Gemini TTS:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate speech' }, { status: 500 });
  }
}
