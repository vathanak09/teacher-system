import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { words, options, modelName = 'gemini-3.5-flash' } = body;

    if (!words || !words.length) {
      return NextResponse.json({ error: 'Words list is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let wordListStr = words;
    if (Array.isArray(words)) {
      wordListStr = words.join(', ');
    }

    const prompt = `
You are an expert English teacher. I will give you a list of words or phrases.
For each word/phrase, please provide the following details based on the user's requested options:

List of words: ${wordListStr}

Requested options:
- Part of Speech: ${options.pos ? 'Yes' : 'No'}
- IPA Pronunciation (US): ${options.ipa ? 'Yes' : 'No'}
- Simple English Meaning: ${options.simpleMeaning ? 'Yes' : 'No'}
- Khmer Translation/Meaning (Short and easy to understand): ${options.khmerMeaning ? 'Yes' : 'No'}
- Synonyms (comma separated): ${options.synonyms ? 'Yes' : 'No'}
- Antonyms (comma separated): ${options.antonyms ? 'Yes' : 'No'}
- Example Sentence: ${options.example ? `Yes, at a ${options.exampleLevel} level` : 'No'}

Return ONLY a JSON array of objects, where each object represents a word from the list and contains the requested fields. Use exact keys: "word", "pos", "ipa", "meaningEn", "meaningKm", "synonyms", "antonyms", "example".
If a requested field doesn't make sense or isn't requested, omit it or leave it empty.
Make sure the Khmer translation is very short, concise, and easy to understand.
`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI");
    }

    let jsonResult;
    try {
      jsonResult = JSON.parse(resultText);
    } catch (e) {
      console.error("Failed to parse JSON:", resultText);
      throw new Error("AI returned invalid JSON format.");
    }

    return NextResponse.json({ data: jsonResult });
  } catch (error: any) {
    console.error('Error generating vocab list:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate vocabulary list' }, { status: 500 });
  }
}
