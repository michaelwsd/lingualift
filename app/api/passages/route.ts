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
      .from('sent_passages')
      .select('id, passage, sent_at')
      .eq('student_id', userId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch passages' }, { status: 500 });
    }

    const passages = (data || []).map(p => ({
      id: p.id,
      passageId: p.passage?.id || '',
      title: p.passage?.title || 'Untitled',
      type: p.passage?.type || '',
      sentAt: p.sent_at,
    }));

    return NextResponse.json({ passages });
  } catch (error) {
    console.error('Failed to fetch passages:', error);
    return NextResponse.json({ error: 'Failed to fetch passages' }, { status: 500 });
  }
}
