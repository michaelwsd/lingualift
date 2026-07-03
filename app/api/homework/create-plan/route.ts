import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { CollectedWord } from '@/types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const EMPTY_EXERCISES = {
  practiceQuestions: [],
  passageFillExercises: [],
  wordMatchingExercises: [],
  synonymBasketExercises: [],
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, studentName, wordsPerDay, days } = await request.json() as {
      studentId: string;
      studentName: string;
      wordsPerDay: number;
      days: number;
    };

    const perDay = Math.max(1, Math.min(50, Math.floor(wordsPerDay)));
    const numDays = Math.max(1, Math.min(30, Math.floor(days)));

    if (!studentId) {
      return NextResponse.json({ error: 'Missing student' }, { status: 400 });
    }

    // Aggregate the student's learned vocabulary from their existing homework.
    const { data: rows, error: fetchError } = await supabaseAdmin
      .from('homework_assignments')
      .select('collected_words')
      .eq('student_id', studentId)
      .eq('teacher_id', userId);

    if (fetchError) {
      console.error('Failed to load student vocabulary:', fetchError);
      return NextResponse.json({ error: 'Failed to load student vocabulary' }, { status: 500 });
    }

    const seen = new Set<string>();
    const pool: CollectedWord[] = [];
    for (const r of rows || []) {
      const words = (r.collected_words || []) as CollectedWord[];
      for (const w of words) {
        const key = (w.word || '').toLowerCase().trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        pool.push(w);
      }
    }

    if (pool.length === 0) {
      return NextResponse.json({ error: 'This student has no vocabulary words yet' }, { status: 400 });
    }

    // Build the daily groups (cycles through a reshuffled deck if the pool is small).
    const plan: CollectedWord[][] = [];
    let deck = shuffle(pool);
    let cursor = 0;
    for (let d = 0; d < numDays; d++) {
      const group: CollectedWord[] = [];
      for (let k = 0; k < perDay; k++) {
        if (cursor >= deck.length) { deck = shuffle(pool); cursor = 0; }
        group.push(deck[cursor++]);
      }
      plan.push(group);
    }

    // unlock date = local midnight today + d days (day 0 is already unlocked).
    // Stored inside the passage JSON (no schema migration needed).
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const unlockIso = (d: number) => new Date(base.getTime() + d * 86400000).toISOString();
    const planId = crypto.randomUUID();

    const payloads = plan.map((group, d) => ({
      teacher_id: userId,
      student_id: studentId,
      student_name: studentName || 'Student',
      homework_type: 'vocabulary',
      passage: {
        id: crypto.randomUUID(),
        title: `Practice Plan — Day ${d + 1}`,
        content: '',
        questions: [],
        topic: 'Practice Plan',
        type: 'Practice Plan',
        createdAt: Date.now(),
        plan: { planId, day: d + 1, totalDays: numDays, unlockDate: unlockIso(d) },
      },
      collected_words: group,
      mc_definitions: [],
      mc_synonyms: [],
      cross_matching_data: { words: [], definitions: [] },
      synonym_groups: { groups: [] },
      generated_exercises: EMPTY_EXERCISES,
    }));

    const { error } = await supabaseAdmin.from('homework_assignments').insert(payloads);
    if (error) {
      console.error('Failed to create practice plan:', error);
      return NextResponse.json({ error: 'Failed to create practice plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, created: numDays });
  } catch (error) {
    console.error('Failed to create practice plan:', error);
    return NextResponse.json({ error: 'Failed to create practice plan' }, { status: 500 });
  }
}
