import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin, isMissingDueDateColumn } from '@/lib/supabase';

const BASE_COLS = 'id, student_name, assigned_at, status, homework_type, passage, collected_words';

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

    let { data, error }: { data: Record<string, any>[] | null; error: { code?: string; message?: string; details?: string } | null } = await supabaseAdmin
      .from('homework_assignments')
      .select(`${BASE_COLS}, due_date`)
      .eq('student_id', studentId)
      .eq('teacher_id', userId)
      .order('assigned_at', { ascending: false });

    if (error && isMissingDueDateColumn(error)) {
      ({ data, error } = await supabaseAdmin
        .from('homework_assignments')
        .select(BASE_COLS)
        .eq('student_id', studentId)
        .eq('teacher_id', userId)
        .order('assigned_at', { ascending: false }));
    }

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
        homeworkType: a.homework_type || 'vocabulary',
        passageId: a.passage?.id || '',
        passageTitle: a.passage?.title || 'Untitled',
        passageType: a.passage?.type || '',
        wordCount: Array.isArray(a.collected_words) ? a.collected_words.length : 0,
        questionCount: Array.isArray(a.passage?.questions) ? a.passage.questions.length : 0,
        dueDate: (a as { due_date?: string | null }).due_date ?? null,
        plan: a.passage?.plan ?? null,
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
