import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Allow access as student or teacher who assigned it
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('homework_assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    if (assignment.student_id !== userId && assignment.teacher_id !== userId) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    const { data: progress } = await supabaseAdmin
      .from('homework_progress')
      .select('*')
      .eq('homework_id', id)
      .eq('student_id', assignment.student_id)
      .single();

    return NextResponse.json({ assignment, progress });
  } catch (error) {
    console.error('Failed to fetch homework:', error);
    return NextResponse.json({ error: 'Failed to fetch homework' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Only the teacher who assigned it can delete
    const { data: assignment, error: fetchError } = await supabaseAdmin
      .from('homework_assignments')
      .select('teacher_id')
      .eq('id', id)
      .single();

    if (fetchError || !assignment) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 });
    }

    if (assignment.teacher_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete progress first (foreign key), then assignment
    await supabaseAdmin
      .from('homework_progress')
      .delete()
      .eq('homework_id', id);

    const { error: deleteError } = await supabaseAdmin
      .from('homework_assignments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete homework:', deleteError);
      return NextResponse.json({ error: 'Failed to delete homework' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete homework:', error);
    return NextResponse.json({ error: 'Failed to delete homework' }, { status: 500 });
  }
}
