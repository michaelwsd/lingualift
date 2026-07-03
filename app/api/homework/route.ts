import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin, isMissingColumnError } from '@/lib/supabase';

const BASE_COLS = 'id, student_name, assigned_at, status, homework_type, passage, collected_words';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let { data, error }: { data: Record<string, any>[] | null; error: { code?: string; message?: string; details?: string } | null } = await supabaseAdmin
      .from('homework_assignments')
      .select(`${BASE_COLS}, due_date`)
      .eq('student_id', userId)
      .order('assigned_at', { ascending: false });

    if (error && isMissingColumnError(error)) {
      ({ data, error } = await supabaseAdmin
        .from('homework_assignments')
        .select(BASE_COLS)
        .eq('student_id', userId)
        .order('assigned_at', { ascending: false }));
    }

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch homework' }, { status: 500 });
    }

    // Return lightweight list (passage title + word count, not full exercise data)
    const assignments = (data || []).map(a => ({
      id: a.id,
      studentName: a.student_name,
      assignedAt: a.assigned_at,
      status: a.status,
      homeworkType: a.homework_type || 'vocabulary',
      passageId: a.passage?.id || '',
      passageTitle: a.passage?.title || 'Untitled',
      passageType: a.passage?.type || '',
      wordCount: Array.isArray(a.collected_words) ? a.collected_words.length : 0,
      questionCount: Array.isArray(a.passage?.questions) ? a.passage.questions.length : 0,
      dueDate: (a as { due_date?: string | null }).due_date ?? null,
      plan: a.passage?.plan ?? null,
    }));

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Failed to fetch homework:', error);
    return NextResponse.json({ error: 'Failed to fetch homework' }, { status: 500 });
  }
}
