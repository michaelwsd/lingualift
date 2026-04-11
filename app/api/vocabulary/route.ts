import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('homework_assignments')
      .select('id, passage, collected_words, assigned_at')
      .eq('student_id', userId)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 });
    }

    const lessons = (data || []).map(hw => ({
      homeworkId: hw.id,
      lessonTitle: hw.passage?.title || 'Untitled',
      assignedAt: hw.assigned_at,
      words: (hw.collected_words || []).map((w: any) => ({
        id: w.id,
        word: w.word,
        phonetic: w.phonetic || null,
        meaning: w.meaning,
        exampleSentence: w.exampleSentence,
        memoryTip: w.memoryTip,
      })),
    }));

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('Failed to fetch vocabulary:', error);
    return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 });
  }
}
