import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { evaluateWordUsage } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { word, meaning, sentence } = await request.json() as {
      word: string;
      meaning: string;
      sentence: string;
    };

    if (!word || !sentence?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await evaluateWordUsage(word, meaning || '', sentence.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to evaluate word usage:', error);
    return NextResponse.json({ error: 'Failed to evaluate word usage' }, { status: 500 });
  }
}
