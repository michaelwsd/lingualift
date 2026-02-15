import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateHomeworkFillInBlank } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { words } = await request.json() as { words: string[] };

    if (!words?.length) {
      return NextResponse.json({ error: 'Words are required' }, { status: 400 });
    }

    const result = await generateHomeworkFillInBlank(words);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to generate fill-in-blank:', error);
    return NextResponse.json({ error: 'Failed to generate exercise' }, { status: 500 });
  }
}
