import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { passages } = await request.json();

    if (!Array.isArray(passages) || passages.length === 0) {
      return NextResponse.json({ error: 'No passages provided' }, { status: 400 });
    }

    const rows = passages.map((p: any) => ({
      id: p.id,
      teacher_id: userId,
      title: p.title,
      content: p.content,
      questions: p.questions || [],
      topic: p.topic,
      type: p.type,
      created_at: new Date(p.createdAt).toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from('passages')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Supabase bulk upsert error:', error);
      return NextResponse.json({ error: 'Failed to sync passages' }, { status: 500 });
    }

    return NextResponse.json({ success: true, synced: rows.length });
  } catch (error) {
    console.error('Failed to sync passages:', error);
    return NextResponse.json({ error: 'Failed to sync passages' }, { status: 500 });
  }
}
