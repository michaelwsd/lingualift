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
    const source = new URL(_request.url).searchParams.get('source') || 'passage';

    if (source === 'homework') {
      // Fetch passage data from homework_assignments table
      // Allow access as student or teacher
      const { data, error } = await supabaseAdmin
        .from('homework_assignments')
        .select('passage, student_id, teacher_id')
        .eq('id', id)
        .single();

      if (error || !data || (data.student_id !== userId && data.teacher_id !== userId)) {
        return NextResponse.json({ error: 'Passage not found' }, { status: 404 });
      }

      return NextResponse.json({ passage: data.passage });
    }

    // Default: fetch from sent_passages table
    // Allow access as student or teacher
    const { data, error } = await supabaseAdmin
      .from('sent_passages')
      .select('passage, student_id, teacher_id')
      .eq('id', id)
      .single();

    if (error || !data || (data.student_id !== userId && data.teacher_id !== userId)) {
      return NextResponse.json({ error: 'Passage not found' }, { status: 404 });
    }

    // Mark as viewed if student is opening it (fire-and-forget, ignore errors)
    if (data.student_id === userId) {
      supabaseAdmin
        .from('sent_passages')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', id)
        .is('viewed_at', null)
        .then(() => {});
    }

    return NextResponse.json({ passage: data.passage });
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

    // Only the teacher who sent it can delete
    const { data: passage, error: fetchError } = await supabaseAdmin
      .from('sent_passages')
      .select('teacher_id')
      .eq('id', id)
      .single();

    if (fetchError || !passage) {
      return NextResponse.json({ error: 'Passage not found' }, { status: 404 });
    }

    if (passage.teacher_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('sent_passages')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete passage:', deleteError);
      return NextResponse.json({ error: 'Failed to delete passage' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete passage:', error);
    return NextResponse.json({ error: 'Failed to delete passage' }, { status: 500 });
  }
}
