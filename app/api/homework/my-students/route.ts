import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get distinct students who have homework assignments
    const { data, error } = await supabaseAdmin
      .from('homework_assignments')
      .select('student_id, student_name')
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Deduplicate by student_id, keeping the first (most recent) name
    const seen = new Set<string>();
    const students: { id: string; name: string }[] = [];
    for (const row of data || []) {
      if (!seen.has(row.student_id)) {
        seen.add(row.student_id);
        students.push({ id: row.student_id, name: row.student_name });
      }
    }

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
