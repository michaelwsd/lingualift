import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { passage } = await request.json();

    if (!passage || !passage.id || !passage.title || !passage.content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('passages')
      .upsert({
        id: passage.id,
        teacher_id: userId,
        title: passage.title,
        content: passage.content,
        questions: passage.questions || [],
        topic: passage.topic,
        type: passage.type,
        created_at: new Date(passage.createdAt).toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({ error: 'Failed to save passage' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: passage.id });
  } catch (error) {
    console.error('Failed to save passage:', error);
    return NextResponse.json({ error: 'Failed to save passage' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('passages')
      .select('id, title, topic, type, created_at')
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch passages' }, { status: 500 });
    }

    return NextResponse.json({ passages: data || [] });
  } catch (error) {
    console.error('Failed to fetch passages:', error);
    return NextResponse.json({ error: 'Failed to fetch passages' }, { status: 500 });
  }
}
