'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchHomework, saveHomeworkProgress } from '@/services/api';
import { HomeworkAssignment, HomeworkPhase, VocabMasteryState, PracticeSessionState } from '@/types';
import { HomeworkProgressBar } from '@/components/homework/HomeworkProgressBar';
import { VocabReview } from '@/components/homework/VocabReview';
import { VocabMasterySession } from '@/components/homework/VocabMasterySession';
import { PracticeSession } from '@/components/homework/PracticeSession';
import { VocabResults } from '@/components/homework/VocabResults';
import { ComprehensionSession } from '@/components/homework/ComprehensionSession';
import { ComprehensionResults } from '@/components/homework/ComprehensionResults';
import { Loader2, LogOut, Lock, ArrowLeft } from 'lucide-react';

const PHASE_ORDER: HomeworkPhase[] = ['vocab_review', 'learning', 'practice', 'completed'];

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
  const [planPrevCompleted, setPlanPrevCompleted] = useState(true);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Always-current ref for beforeunload (avoids stale closure)
  const latestStateRef = useRef({ currentPhase, exercisesCompleted, answersGiven });
  useEffect(() => {
    latestStateRef.current = { currentPhase, exercisesCompleted, answersGiven };
  }, [currentPhase, exercisesCompleted, answersGiven]);

  // Load assignment + progress
  useEffect(() => {
    const load = async () => {
      try {
        const { assignment: hw, progress, planPrevCompleted: prevDone } = await fetchHomework(id);
        setAssignment(hw);
        setPlanPrevCompleted(prevDone ?? true);

        if (progress) {
          const phase = progress.current_phase as string;
          let resolvedPhase: HomeworkPhase;
          if (phase === 'completed') {
            resolvedPhase = 'completed';
          } else if (phase === 'learning') {
            resolvedPhase = 'learning';
          } else if (phase === 'practice') {
            resolvedPhase = 'practice';
          } else if (phase === 'vocab_review') {
            // Comprehension homework skips the vocab stages
            resolvedPhase = hw.homework_type === 'comprehension' ? 'practice' : 'vocab_review';
          } else {
            // Legacy phase names → start practice fresh
            resolvedPhase = 'practice';
          }
          // Learning-only homework (practice plan) has no Practice stage.
          const hwEx = hw.generated_exercises;
          const hwHasPractice = !!hwEx && (
            (hwEx.practiceQuestions?.length || 0) > 0 ||
            (hwEx.passageFillExercises?.length || 0) > 0 ||
            (hwEx.wordMatchingExercises?.length || 0) > 0
          );
          if (resolvedPhase === 'practice' && !hwHasPractice) {
            resolvedPhase = 'completed';
          }
          setCurrentPhase(resolvedPhase);
          setExercisesCompleted(progress.exercises_completed as string[]);
          setAnswersGiven(progress.answers_given as Record<string, any>);

          // Restore progress-bar stats for the active stage
          if (resolvedPhase === 'learning') {
            const vocabState = progress.answers_given?.vocabMastery as VocabMasteryState | undefined;
            if (vocabState) {
              setTotalQuestions(vocabState.order?.length || 0);
              setCorrectCount(vocabState.clearedTaskIds?.length || 0);
            }
          } else if (resolvedPhase === 'practice') {
            const practiceState = progress.answers_given?.practice as PracticeSessionState | undefined;
            if (practiceState) {
              const total = (practiceState.allQuestions?.length || 0)
                + (practiceState.passageFills?.length || 0)
                + (practiceState.matchingExercises?.length || 0);
              setTotalQuestions(total);
              setCorrectCount(practiceState.answeredCorrectly?.length || 0);
            }
          }
        } else if (hw.homework_type === 'comprehension') {
          // Comprehension homework starts directly (no vocab stages)
          setCurrentPhase('practice');
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

  // Save on beforeunload — uses ref so handler never has stale state
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      const { currentPhase: phase, exercisesCompleted: completed, answersGiven: answers } = latestStateRef.current;
      navigator.sendBeacon(
        `/api/homework/${id}/progress`,
        new Blob(
          [JSON.stringify({
            currentPhase: phase,
            exercisesCompleted: completed,
            answersGiven: answers,
          })],
          { type: 'application/json' }
        )
      );
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [id]);

  const advancePhase = useCallback((completedPhase: HomeworkPhase) => {
    const currentIdx = PHASE_ORDER.indexOf(completedPhase);
    const nextPhase = PHASE_ORDER[currentIdx + 1] || 'completed';

    const newCompleted = [...exercisesCompleted, completedPhase];
    setExercisesCompleted(newCompleted);
    setCurrentPhase(nextPhase);
    debouncedSave(nextPhase, newCompleted, answersGiven);
  }, [exercisesCompleted, answersGiven, debouncedSave]);

  const handleLearningStateChange = useCallback((state: VocabMasteryState) => {
    setTotalQuestions(state.order.length);
    setCorrectCount(state.clearedTaskIds.length);

    setAnswersGiven(prev => {
      const updated = { ...prev, vocabMastery: state };
      // Update ref immediately so beforeunload always has latest state
      latestStateRef.current = { ...latestStateRef.current, answersGiven: updated };
      debouncedSave('learning', exercisesCompleted, updated);
      return updated;
    });
  }, [exercisesCompleted, debouncedSave]);

  const handleLearningComplete = useCallback(() => {
    const ex = assignment?.generated_exercises;
    const hasPractice = !!ex && (
      (ex.practiceQuestions?.length || 0) > 0 ||
      (ex.passageFillExercises?.length || 0) > 0 ||
      (ex.wordMatchingExercises?.length || 0) > 0
    );
    if (hasPractice) {
      // Learning → Practice. Reset the progress bar for the new stage.
      setTotalQuestions(0);
      setCorrectCount(0);
      advancePhase('learning');
    } else {
      // Practice-plan / learning-only homework — finish after the gauntlet.
      const newCompleted = [...exercisesCompleted, 'learning', 'practice'];
      setExercisesCompleted(newCompleted);
      setCurrentPhase('completed');
      debouncedSave('completed', newCompleted, answersGiven);
    }
  }, [assignment, advancePhase, exercisesCompleted, answersGiven, debouncedSave]);

  const handlePracticeStateChange = useCallback((state: PracticeSessionState) => {
    const total = state.allQuestions.length
      + (state.passageFills?.length || 0)
      + (state.matchingExercises?.length || 0);
    setTotalQuestions(total);
    setCorrectCount(state.answeredCorrectly.length);

    setAnswersGiven(prev => {
      const updated = { ...prev, practice: state };
      latestStateRef.current = { ...latestStateRef.current, answersGiven: updated };
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

  // Practice-plan days unlock only when their date has arrived AND the previous
  // day is completed.
  const plan = assignment.passage?.plan;
  if (plan) {
    const dateLocked = !!plan.unlockDate && new Date(plan.unlockDate).getTime() > Date.now();
    const prevLocked = plan.day > 1 && !planPrevCompleted;
    if (dateLocked || prevLocked) {
      const reason = dateLocked
        ? `Come back on ${new Date(plan.unlockDate!).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })} to unlock it.`
        : `Finish Day ${plan.day - 1} first to unlock this one.`;
      return (
        <div className="h-full flex items-center justify-center px-4">
          <div className="text-center max-w-sm animate-scale-in">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-stone-400" />
            </div>
            <h2 className="text-xl font-serif font-bold text-slate-900 mb-1">Day {plan.day} is locked</h2>
            <p className="text-sm text-stone-500 mb-6">{reason}</p>
            <button
              onClick={() => router.push('/student/homework')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Homework
            </button>
          </div>
        </div>
      );
    }
  }

  const isComprehension = assignment.homework_type === 'comprehension';

  const handleComprehensionStateChange = (comprehensionAnswers: Record<string, any>) => {
    setAnswersGiven(prev => {
      const updated = { ...prev, comprehension: comprehensionAnswers };
      latestStateRef.current = { ...latestStateRef.current, answersGiven: updated };
      debouncedSave(currentPhase, exercisesCompleted, updated);
      return updated;
    });
  };

  const handleComprehensionComplete = () => {
    const newCompleted = [...exercisesCompleted, 'comprehension'];
    setExercisesCompleted(newCompleted);
    setCurrentPhase('completed');
    debouncedSave('completed', newCompleted, answersGiven);
  };

  if (isComprehension) {
    return (
      <div className="h-full flex flex-col">
        {currentPhase === 'completed' ? (
          <ComprehensionResults
            passage={assignment.passage}
            answers={answersGiven.comprehension}
          />
        ) : (
          <ComprehensionSession
            passage={assignment.passage}
            savedAnswers={answersGiven.comprehension || undefined}
            onStateChange={handleComprehensionStateChange}
            onComplete={handleComprehensionComplete}
            onExit={handleExit}
          />
        )}
      </div>
    );
  }

  const exercises = assignment.generated_exercises;
  const hasPractice = !!exercises && (
    (exercises.practiceQuestions?.length || 0) > 0 ||
    (exercises.passageFillExercises?.length || 0) > 0 ||
    (exercises.wordMatchingExercises?.length || 0) > 0
  );

  return (
    <div className="h-full flex flex-col">
      <div className="relative">
        <HomeworkProgressBar
          currentPhase={currentPhase}
          completedPhases={exercisesCompleted}
          hasPractice={hasPractice}
          allQuestionsCount={totalQuestions}
          correctlyAnsweredCount={correctCount}
          onPhaseClick={handlePhaseClick}
        />
        {currentPhase !== 'completed' && (
          <>
            <button
              onClick={handleExit}
              className="absolute top-4 left-3 sm:left-5 lg:left-8 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              title="Save and exit"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit
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

        {currentPhase === 'learning' && (
          <VocabMasterySession
            words={assignment.collected_words}
            savedState={answersGiven.vocabMastery || null}
            onStateChange={handleLearningStateChange}
            onComplete={handleLearningComplete}
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
          <VocabResults
            state={answersGiven.vocabMastery || null}
            words={assignment.collected_words}
          />
        )}
      </div>
    </div>
  );
}
