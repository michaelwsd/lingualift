import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { currentPhase, exercisesCompleted, answersGiven } = await request.json();

    // Upsert progress
    const { error: progressError } = await supabaseAdmin
      .from('homework_progress')
      .upsert(
        {
          homework_id: id,
          student_id: userId,
          current_phase: currentPhase,
          exercises_completed: exercisesCompleted,
          answers_given: answersGiven,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'homework_id,student_id' }
      );

    if (progressError) {
      console.error('Progress save error:', progressError);
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }

    // Update assignment status
    const status = currentPhase === 'completed' ? 'completed' : 'in_progress';
    await supabaseAdmin
      .from('homework_assignments')
      .update({ status })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save progress:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
