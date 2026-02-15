'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchHomework, saveHomeworkProgress } from '@/services/api';
import { HomeworkAssignment, HomeworkPhase, PracticeSessionState } from '@/types';
import { HomeworkProgressBar } from '@/components/homework/HomeworkProgressBar';
import { VocabReview } from '@/components/homework/VocabReview';
import { PracticeSession } from '@/components/homework/PracticeSession';
import { CompletionScreen } from '@/components/homework/CompletionScreen';
import { Loader2, LogOut, Bug } from 'lucide-react';

const PHASE_ORDER: HomeworkPhase[] = ['vocab_review', 'practice', 'completed'];

export default function HomeworkSessionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [assignment, setAssignment] = useState<HomeworkAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState<HomeworkPhase>('vocab_review');
  const [exercisesCompleted, setExercisesCompleted] = useState<string[]>([]);
  const [answersGiven, setAnswersGiven] = useState<Record<string, any>>({});

  // Practice stats for the progress bar
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load assignment + progress
  useEffect(() => {
    const load = async () => {
      try {
        const { assignment: hw, progress } = await fetchHomework(id);
        setAssignment(hw);

        if (progress) {
          // Migration: old phases map to 'practice'
          const phase = progress.current_phase as string;
          if (phase === 'completed') {
            setCurrentPhase('completed');
          } else if (phase === 'vocab_review') {
            setCurrentPhase('vocab_review');
          } else if (phase === 'practice') {
            setCurrentPhase('practice');
          } else {
            // Old phase (mc_definitions, mc_synonyms, etc.) → start practice fresh
            setCurrentPhase('practice');
          }
          setExercisesCompleted(progress.exercises_completed as string[]);
          setAnswersGiven(progress.answers_given as Record<string, any>);

          // Restore practice stats from saved state
          const practiceState = progress.answers_given?.practice as PracticeSessionState | undefined;
          if (practiceState) {
            const total = (practiceState.allQuestions?.length || 0)
              + (practiceState.passageFills?.length || 0)
              + (practiceState.matchingExercises?.length || 0)
              + (practiceState.basketExercises?.length || 0);
            setTotalQuestions(total);
            setCorrectCount(practiceState.answeredCorrectly?.length || 0);
          }
        }
      } catch {
        router.push('/student/homework');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  // Debounced save
  const debouncedSave = useCallback(
    (phase: HomeworkPhase, completed: string[], answers: Record<string, any>) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveHomeworkProgress(id, {
          currentPhase: phase,
          exercisesCompleted: completed,
          answersGiven: answers,
        }).catch(console.error);
      }, 500);
    },
    [id]
  );

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      navigator.sendBeacon(
        `/api/homework/${id}/progress`,
        new Blob(
          [JSON.stringify({
            currentPhase,
            exercisesCompleted,
            answersGiven,
          })],
          { type: 'application/json' }
        )
      );
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [id, currentPhase, exercisesCompleted, answersGiven]);

  const advancePhase = useCallback((completedPhase: HomeworkPhase) => {
    const currentIdx = PHASE_ORDER.indexOf(completedPhase);
    const nextPhase = PHASE_ORDER[currentIdx + 1] || 'completed';

    const newCompleted = [...exercisesCompleted, completedPhase];
    setExercisesCompleted(newCompleted);
    setCurrentPhase(nextPhase);
    debouncedSave(nextPhase, newCompleted, answersGiven);
  }, [exercisesCompleted, answersGiven, debouncedSave]);

  const handlePracticeStateChange = useCallback((state: PracticeSessionState) => {
    const total = state.allQuestions.length
      + (state.passageFills?.length || 0)
      + (state.matchingExercises?.length || 0)
      + (state.basketExercises?.length || 0);
    setTotalQuestions(total);
    setCorrectCount(state.answeredCorrectly.length);

    setAnswersGiven(prev => {
      const updated = { ...prev, practice: state };
      debouncedSave('practice', exercisesCompleted, updated);
      return updated;
    });
  }, [exercisesCompleted, debouncedSave]);

  const handlePracticeComplete = useCallback(() => {
    const newCompleted = [...exercisesCompleted, 'practice'];
    setExercisesCompleted(newCompleted);
    setCurrentPhase('completed');
    debouncedSave('completed', newCompleted, answersGiven);
  }, [exercisesCompleted, answersGiven, debouncedSave]);

  const handlePhaseClick = useCallback((phase: HomeworkPhase) => {
    if (phase === currentPhase) return;
    setCurrentPhase(phase);
    debouncedSave(phase, exercisesCompleted, answersGiven);
  }, [currentPhase, exercisesCompleted, answersGiven, debouncedSave]);

  const handleExit = useCallback(() => {
    // Flush any pending save immediately
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveHomeworkProgress(id, {
      currentPhase,
      exercisesCompleted,
      answersGiven,
    }).catch(console.error).finally(() => {
      router.push('/student/homework');
    });
  }, [id, currentPhase, exercisesCompleted, answersGiven, router]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-400">Loading homework...</p>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="relative">
        <HomeworkProgressBar
          currentPhase={currentPhase}
          allQuestionsCount={totalQuestions}
          correctlyAnsweredCount={correctCount}
          onPhaseClick={handlePhaseClick}
        />
        {currentPhase !== 'completed' && (
          <>
            <button
              onClick={handleExit}
              className="absolute top-4 left-5 lg:left-8 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              title="Save and exit"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit
            </button>
            <button
              onClick={() => {
                if (currentPhase === 'vocab_review') {
                  advancePhase('vocab_review');
                } else if (currentPhase === 'practice') {
                  handlePracticeComplete();
                }
              }}
              className="absolute top-4 right-5 lg:right-8 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-500 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
              title="Debug: skip to next phase"
            >
              <Bug className="w-3.5 h-3.5" />
              Skip
            </button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {currentPhase === 'vocab_review' && (
          <VocabReview
            words={assignment.collected_words}
            onComplete={() => advancePhase('vocab_review')}
          />
        )}

        {currentPhase === 'practice' && (
          <PracticeSession
            assignment={assignment}
            savedState={answersGiven.practice || null}
            onStateChange={handlePracticeStateChange}
            onComplete={handlePracticeComplete}
          />
        )}

        {currentPhase === 'completed' && (
          <CompletionScreen
            totalWords={assignment.collected_words.length}
          />
        )}
      </div>
    </div>
  );
}
