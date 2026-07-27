import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { words, options, modelName = 'gemini-3.5-flash', image } = body;

    if ((!words || !words.length) && !image) {
      return NextResponse.json({ error: 'Words list or an image is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let wordListStr = words || [];
    if (Array.isArray(words)) {
      wordListStr = words.join(', ');
    }

    let imageInstruction = "";
    if (image) {
      imageInstruction = `
I have provided an image containing text. 
Please extract words from the image based on the following rules:
`;
      if (options.extractHighlighted) {
        imageInstruction += "- Extract words that are highlighted, underlined, or circled in the image.\n";
      }
      if (options.extractDifficult) {
        imageInstruction += `- Extract words that are considered "difficult" for a ${options.difficultLevel || 'beginner'} English learner.\n`;
      }
      if (!options.extractHighlighted && !options.extractDifficult) {
        imageInstruction += "- Extract all distinct, important vocabulary words from the image.\n";
      }
      imageInstruction += "\nThen, for all extracted words (and any words provided in the list below), generate the required vocabulary details.\n\n";
    }

    const prompt = `
You are an expert English teacher. ${imageInstruction}
I will give you a list of words or phrases.
For each word/phrase, please provide the following details based on the user's requested options.
IMPORTANT: If a word has parentheses next to it (e.g., "bank (2 meanings)" or "apple (fruit)"), pay close attention to that context or instruction when generating meanings and examples.

List of words: ${wordListStr ? wordListStr : "(None, extract from image only)"}

Requested options:
- Part of Speech: ${options.pos ? 'Yes' : 'No'}
- IPA Pronunciation (US): ${options.ipa ? 'Yes' : 'No'}
- Simple English Meaning: ${options.simpleMeaning ? 'Yes' : 'No'}
- Khmer Translation/Meaning: ${options.khmerMeaning ? 'Yes (Short and easy to understand)' : 'No'}
- Synonyms: ${options.synonyms ? 'Yes (comma separated)' : 'No'}
- Antonyms: ${options.antonyms ? 'Yes (comma separated)' : 'No'}
- Examples: ${options.example ? `Yes, provide exactly ${options.exampleCount || 1} example sentence(s) at a ${options.exampleLevel} level.` : 'No'}

Return ONLY a JSON array of objects, where each object represents a word and contains the requested fields. Use exact keys: "word", "pos", "ipa", "meaningEn", "meaningKm", "synonyms", "antonyms", "examples".
Note: "examples" MUST be an array of strings (e.g., ["Example 1", "Example 2"]).
If a requested field doesn't make sense or isn't requested, omit it or leave it empty.
Make sure the Khmer translation is very short, concise, and easy to understand.
`;

    let contents: any[] = [prompt];
    if (image && image.base64 && image.mimeType) {
      contents.push({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
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
