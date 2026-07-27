import textToSpeech from '@google-cloud/text-to-speech';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, languageCode = 'km-KH', name = 'km-KH-Standard-A' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    let credentials = undefined;
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      try {
        credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      } catch (e) {
        console.error("Invalid GOOGLE_CREDENTIALS_JSON format");
      }
    }
    
    const client = new textToSpeech.TextToSpeechClient({
      credentials,
      projectId: credentials?.project_id || process.env.GOOGLE_PROJECT_ID,
    });

    const requestBody = {
      input: { text: text },
      voice: { languageCode, name },
      audioConfig: { audioEncoding: 'MP3' as const },
    };

    const [response] = await client.synthesizeSpeech(requestBody);
    
    if (!response.audioContent) {
      throw new Error("No audio content returned");
    }

    const audioBase64 = Buffer.from(response.audioContent).toString('base64');
    
    return NextResponse.json({ audioBase64 });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate speech' }, { status: 500 });
  }
}
