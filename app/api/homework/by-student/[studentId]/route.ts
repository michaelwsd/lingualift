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

    // Fetch progress for all homework in one query
    const homeworkIds = (data || []).map(a => a.id);
    let progressMap: Record<string, any> = {};
    if (homeworkIds.length > 0) {
      const { data: progressData } = await supabaseAdmin
        .from('homework_progress')
        .select('homework_id, current_phase, exercises_completed, answers_given')
        .eq('student_id', studentId)
        .in('homework_id', homeworkIds);

      for (const p of progressData || []) {
        progressMap[p.homework_id] = p;
      }
    }

    const assignments = (data || []).map(a => {
      const progress = progressMap[a.id];

      // Determine granular progress status:
      // - "not_started": no progress record (student never opened)
      // - "started": progress exists but still on vocab_review with no exercises completed
      // - "in_progress": student has attempted at least one question
      // - "completed": homework is completed
      let progressStatus: 'not_started' | 'started' | 'in_progress' | 'completed' = 'not_started';
      let completionPercent = 0;

      if (progress) {
        if (progress.current_phase === 'completed') {
          progressStatus = 'completed';
          completionPercent = 100;
        } else if (
          progress.current_phase === 'practice' ||
          (Array.isArray(progress.exercises_completed) && progress.exercises_completed.length > 0)
        ) {
          progressStatus = 'in_progress';

          // Calculate completion from practice state
          const practiceState = progress.answers_given?.practice;
          if (practiceState) {
            const total = (practiceState.allQuestions?.length || 0)
              + (practiceState.passageFills?.length || 0)
              + (practiceState.matchingExercises?.length || 0);
            const correct = practiceState.answeredCorrectly?.length || 0;
            completionPercent = total > 0 ? Math.round((correct / total) * 100) : 0;
          }
        } else {
          progressStatus = 'started';
        }
      }

      return {
        id: a.id,
        studentName: a.student_name,
        assignedAt: a.assigned_at,
        status: a.status,
        passageId: a.passage?.id || '',
        passageTitle: a.passage?.title || 'Untitled',
        passageType: a.passage?.type || '',
        wordCount: Array.isArray(a.collected_words) ? a.collected_words.length : 0,
        progressStatus,
        completionPercent,
      };
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Failed to fetch homework by student:', error);
    return NextResponse.json({ error: 'Failed to fetch homework' }, { status: 500 });
  }
}
