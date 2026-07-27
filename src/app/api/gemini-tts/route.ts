import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, voiceName = 'Aoede', modelName = 'gemini-2.5-flash-preview-tts' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing in environment variables.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Call Gemini API to generate audio
    const response = await ai.models.generateContent({
      model: modelName,
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
    if (!audioBase64) {
      throw new Error("Audio data is undefined.");
    }
    
    // Convert raw PCM to WAV
    const pcmBuffer = Buffer.from(audioBase64, 'base64');
    const wavHeader = Buffer.alloc(44);
    const numChannels = 1;
    const sampleRate = 24000;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmBuffer.length;

    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + dataSize, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16); // PCM chunk size
    wavHeader.writeUInt16LE(1, 20); // Audio format (1 = PCM)
    wavHeader.writeUInt16LE(numChannels, 22);
    wavHeader.writeUInt32LE(sampleRate, 24);
    wavHeader.writeUInt32LE(byteRate, 28);
    wavHeader.writeUInt16LE(blockAlign, 32);
    wavHeader.writeUInt16LE(bytesPerSample * 8, 34);
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(dataSize, 40);

    const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);
    const finalBase64 = wavBuffer.toString('base64');
    
    return NextResponse.json({ audioBase64: finalBase64, mimeType: 'audio/wav' });
  } catch (error: any) {
    console.error('Error generating Gemini TTS:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate speech' }, { status: 500 });
  }
}
