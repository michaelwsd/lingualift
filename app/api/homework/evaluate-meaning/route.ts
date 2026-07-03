import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { evaluateWordMeaning } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { word, meaning, description } = await request.json() as {
      word: string;
      meaning: string;
      description: string;
    };

    if (!word || !description?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await evaluateWordMeaning(word, meaning || '', description.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to evaluate word meaning:', error);
    return NextResponse.json({ error: 'Failed to evaluate word meaning' }, { status: 500 });
  }
}
