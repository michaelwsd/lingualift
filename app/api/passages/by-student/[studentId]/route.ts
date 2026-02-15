import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    const { data, error } = await supabaseAdmin
      .from('sent_passages')
      .select('id, passage, sent_at, viewed_at')
      .eq('student_id', studentId)
      .eq('teacher_id', userId)
      .order('sent_at', { ascending: false });

    if (error) {
      // If viewed_at column doesn't exist yet, retry without it
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('sent_passages')
        .select('id, passage, sent_at')
        .eq('student_id', studentId)
        .eq('teacher_id', userId)
        .order('sent_at', { ascending: false });

      if (fallbackError) {
        console.error('Supabase query error:', fallbackError);
        return NextResponse.json({ error: 'Failed to fetch passages' }, { status: 500 });
      }

      const passages = (fallbackData || []).map(p => ({
        id: p.id,
        passageId: p.passage?.id || '',
        title: p.passage?.title || 'Untitled',
        type: p.passage?.type || '',
        sentAt: p.sent_at,
        viewed: false,
      }));

      return NextResponse.json({ passages });
    }

    const passages = (data || []).map(p => ({
      id: p.id,
      passageId: p.passage?.id || '',
      title: p.passage?.title || 'Untitled',
      type: p.passage?.type || '',
      sentAt: p.sent_at,
      viewed: !!(p as any).viewed_at,
    }));

    return NextResponse.json({ passages });
  } catch (error) {
    console.error('Failed to fetch passages:', error);
    return NextResponse.json({ error: 'Failed to fetch passages' }, { status: 500 });
  }
}
