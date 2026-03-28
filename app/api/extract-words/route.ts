import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    words: {
      type: Type.ARRAY,
      description: 'Array of challenging vocabulary words extracted from the passage',
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: 'The challenging word or short phrase exactly as it appears in the passage' },
          meaning: { type: Type.STRING, description: 'A clear, concise definition suitable for a language learner' },
          exampleSentence: { type: Type.STRING, description: 'An example sentence using the word (different from the passage)' },
          memoryTip: { type: Type.STRING, description: 'A short memory tip or mnemonic to help remember the word' },
        },
        required: ['word', 'meaning', 'exampleSentence', 'memoryTip'],
      },
    },
  },
  required: ['words'],
} as const;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, existingWords } = await request.json() as {
      content: string;
      existingWords: string[];
    };

    if (!content) {
      return NextResponse.json({ error: 'Missing passage content' }, { status: 400 });
    }

    const excludeList = existingWords?.length
      ? `\n\nDo NOT include these words as they are already collected: ${existingWords.join(', ')}`
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a language teacher helping EAL (English as an Additional Language) students build vocabulary. Analyze the following passage and extract 15-25 vocabulary words that an EAL student would benefit from studying.

Include a mix of:
- Medium-level words that EAL students may not know well (e.g. "arrogance", "perilous", "retrieve")
- More advanced/literary vocabulary (e.g. "indispensable", "formidable", "arduous")
- Words with rich meanings, nuances, or that are important for understanding the passage
- Idiomatic expressions or phrases if present

Do NOT include:
- Very basic everyday words (e.g. "said", "went", "big", "good")
- Proper nouns (names of people, places)
- Numbers${excludeList}

Passage:
${content}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
      },
    });

    const result = JSON.parse(response.text || '{"words":[]}');

    return NextResponse.json({ words: result.words || [] });
  } catch (error) {
    console.error('Failed to extract words:', error);
    return NextResponse.json({ error: 'Failed to extract words' }, { status: 500 });
  }
}
