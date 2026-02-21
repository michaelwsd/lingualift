import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('passages')
      .select('*')
      .eq('id', id)
      .eq('teacher_id', userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Passage not found' }, { status: 404 });
    }

    const passage = {
      id: data.id,
      title: data.title,
      content: data.content,
      questions: data.questions,
      topic: data.topic,
      type: data.type,
      createdAt: new Date(data.created_at).getTime(),
    };

    return NextResponse.json({ passage });
  } catch (error) {
    console.error('Failed to fetch passage:', error);
    return NextResponse.json({ error: 'Failed to fetch passage' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('passages')
      .delete()
      .eq('id', id)
      .eq('teacher_id', userId);

    if (error) {
      console.error('Failed to delete passage:', error);
      return NextResponse.json({ error: 'Failed to delete passage' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete passage:', error);
    return NextResponse.json({ error: 'Failed to delete passage' }, { status: 500 });
  }
}
