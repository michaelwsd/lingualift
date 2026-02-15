import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateMCDefinitions, generateMCSynonyms, generateHomeworkSynonyms } from '@/lib/gemini';
import { CollectedWord } from '@/types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, studentName, passage, collectedWords } = await request.json() as {
      studentId: string;
      studentName: string;
      passage: any;
      collectedWords: CollectedWord[];
    };

    if (!studentId || !passage || !collectedWords?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate all exercises in parallel
    const [mcDefinitions, mcSynonyms, synonymGroups] = await Promise.all([
      generateMCDefinitions(collectedWords),
      generateMCSynonyms(collectedWords),
      generateHomeworkSynonyms(collectedWords.map(w => w.word)),
    ]);

    // Prepare cross-matching data with shuffled order
    const crossMatchingData = {
      words: shuffle(collectedWords.map(w => ({ id: w.id, text: w.word }))),
      definitions: shuffle(collectedWords.map(w => ({ id: w.id, text: w.meaning }))),
    };

    const { data, error } = await supabaseAdmin
      .from('homework_assignments')
      .insert({
        teacher_id: userId,
        student_id: studentId,
        student_name: studentName,
        passage,
        collected_words: collectedWords,
        mc_definitions: mcDefinitions,
        mc_synonyms: mcSynonyms,
        cross_matching_data: crossMatchingData,
        synonym_groups: { groups: synonymGroups },
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save homework' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Failed to send homework:', error);
    return NextResponse.json({ error: 'Failed to send homework' }, { status: 500 });
  }
}
