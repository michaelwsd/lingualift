import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin, isMissingDueDateColumn } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, studentName, passage, dueDate } = await request.json() as {
      studentId: string;
      studentName: string;
      passage: any;
      dueDate?: string | null;
    };

    if (!studentId || !passage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const basePayload = {
      teacher_id: userId,
      student_id: studentId,
      student_name: studentName,
      homework_type: 'comprehension',
      passage,
      collected_words: [],
      mc_definitions: [],
      mc_synonyms: [],
      cross_matching_data: { words: [], definitions: [] },
      synonym_groups: { groups: [] },
      generated_exercises: {
        practiceQuestions: [],
        passageFillExercises: [],
        wordMatchingExercises: [],
        synonymBasketExercises: [],
      },
    };

    let { data, error } = await supabaseAdmin
      .from('homework_assignments')
      .insert(dueDate ? { ...basePayload, due_date: dueDate } : basePayload)
      .select('id')
      .single();

    if (error && dueDate && isMissingDueDateColumn(error)) {
      ({ data, error } = await supabaseAdmin
        .from('homework_assignments')
        .insert(basePayload)
        .select('id')
        .single());
    }

    if (error || !data) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save homework' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Failed to send comprehension homework:', error);
    return NextResponse.json({ error: 'Failed to send homework' }, { status: 500 });
  }
}
