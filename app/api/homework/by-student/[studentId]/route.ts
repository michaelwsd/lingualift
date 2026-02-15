import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    const { data, error } = await supabaseAdmin
      .from('homework_assignments')
      .select('id, student_name, assigned_at, status, passage, collected_words')
      .eq('student_id', studentId)
      .eq('teacher_id', userId)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch homework' }, { status: 500 });
    }

    const assignments = (data || []).map(a => ({
      id: a.id,
      studentName: a.student_name,
      assignedAt: a.assigned_at,
      status: a.status,
      passageTitle: a.passage?.title || 'Untitled',
      passageType: a.passage?.type || '',
      wordCount: Array.isArray(a.collected_words) ? a.collected_words.length : 0,
    }));

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Failed to fetch homework by student:', error);
    return NextResponse.json({ error: 'Failed to fetch homework' }, { status: 500 });
  }
}
