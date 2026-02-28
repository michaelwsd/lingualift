'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HomeworkAssignment,
  PracticeQuestion,
  PracticeQuestionType,
  PracticeSessionState,
  PassageFillExercise,
  WordMatchingExercise,
} from '@/types';
import { PassageFill } from './PassageFill';
import { WordMatching } from './WordMatching';
import { Check, X, ArrowRight, BookOpen, ListChecks, ArrowRightLeft, PenLine, Layers } from 'lucide-react';

// --- Helpers ---

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Queue helpers ---

interface QueueItemMeta {
  id: string;
  wordIds: string[];
}

function buildConstrainedQueue(items: QueueItemMeta[]): string[] {
  const pool = shuffle([...items]);
  const result: string[] = [];
  const used = new Set<number>();

  let prevWordIds = new Set<string>();

  while (used.size < pool.length) {
    let picked = -1;
    for (let i = 0; i < pool.length; i++) {
      if (used.has(i)) continue;
      const overlaps = pool[i].wordIds.some(w => prevWordIds.has(w));
      if (!overlaps) {
        picked = i;
        break;
      }
    }
    if (picked === -1) {
      for (let i = 0; i < pool.length; i++) {
        if (!used.has(i)) { picked = i; break; }
      }
    }

    result.push(pool[picked].id);
    prevWordIds = new Set(pool[picked].wordIds);
    used.add(picked);
  }

  return result;
}

function generateMoreQueue(
  questions: PracticeQuestion[],
  passageFills: PassageFillExercise[],
  matchingExercises: WordMatchingExercise[],
  correct: Set<string>,
  incorrect: Set<string>,
): string[] {
  const allItems: QueueItemMeta[] = [];
  questions.forEach(q => allItems.push({ id: q.id, wordIds: [q.wordId] }));
  passageFills.forEach(p => allItems.push({ id: p.id, wordIds: p.wordIds }));
  matchingExercises.forEach(m => allItems.push({ id: m.id, wordIds: m.wordIds }));

  const wrongUncorrected = allItems.filter(item => incorrect.has(item.id) && !correct.has(item.id));
  const neverAnswered = allItems.filter(item => !correct.has(item.id) && !incorrect.has(item.id));
  const random = shuffle(allItems).slice(0, 5);

  const batch = [...shuffle(wrongUncorrected), ...shuffle(neverAnswered), ...shuffle(random)];
  const ids = batch.map(item => item.id);

  return ids.length >= 5 ? ids : [...ids, ...shuffle(allItems.map(i => i.id)).slice(0, Math.max(5 - ids.length, 1))];
}

// --- Type badge config ---

const TYPE_CONFIG: Record<PracticeQuestionType, { label: string; icon: React.ReactNode; promptLabel: string }> = {
  mc_definition: { label: 'Definition', icon: <ListChecks className="w-3 h-3" />, promptLabel: 'What does this word mean?' },
  mc_synonym: { label: 'Synonym', icon: <BookOpen className="w-3 h-3" />, promptLabel: 'Which word is a synonym of' },
  matching: { label: 'Matching', icon: <ArrowRightLeft className="w-3 h-3" />, promptLabel: 'Which word matches this definition?' },
  fill_in_blank: { label: 'Fill Blank', icon: <PenLine className="w-3 h-3" />, promptLabel: 'Fill in the blank' },
  grouping: { label: 'Grouping', icon: <Layers className="w-3 h-3" />, promptLabel: 'Which word is this a synonym of?' },
};

// --- Component ---

interface PracticeSessionProps {
  assignment: HomeworkAssignment;
  savedState?: PracticeSessionState | null;
  onStateChange: (state: PracticeSessionState) => void;
  onComplete: () => void;
}

export const PracticeSession: React.FC<PracticeSessionProps> = ({
  assignment,
  savedState,
  onStateChange,
  onComplete,
}) => {
  // Load exercises from pre-generated data or saved state
  const exercises = assignment.generated_exercises;

  // Guard: older assignments may not have pre-generated exercises
  if (!exercises && !savedState) {
    return (
      <div className="h-full flex items-center justify-center px-5">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-stone-600">This homework was created before exercise pre-generation was added.</p>
          <p className="text-xs text-stone-400">Please ask your teacher to re-send the homework.</p>
        </div>
      </div>
    );
  }

  const allQuestions = savedState?.allQuestions || exercises?.practiceQuestions || [];
  const passageFills = savedState?.passageFills || exercises?.passageFillExercises || [];
  const matchingExercises = savedState?.matchingExercises || exercises?.wordMatchingExercises || [];

  // Build initial queue if no saved state
  const initialQueue = useMemo(() => {
    if (savedState?.queue) return savedState.queue;
    const queueItems: QueueItemMeta[] = [];
    allQuestions.forEach(q => queueItems.push({ id: q.id, wordIds: [q.wordId] }));
    passageFills.forEach(p => queueItems.push({ id: p.id, wordIds: p.wordIds }));
    matchingExercises.forEach(m => queueItems.push({ id: m.id, wordIds: m.wordIds }));
    return buildConstrainedQueue(queueItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [queue, setQueue] = useState<string[]>(initialQueue);
  const [currentIndex, setCurrentIndex] = useState(savedState?.currentQueueIndex || 0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<Set<string>>(
    () => new Set(savedState?.answeredCorrectly || [])
  );
  const [answeredIncorrectly, setAnsweredIncorrectly] = useState<Set<string>>(
    () => new Set(savedState?.answeredIncorrectly || [])
  );

  // On mount: if saved index is past queue end, extend queue or complete
  const [initialized, setInitialized] = useState(!savedState || (savedState.currentQueueIndex || 0) < initialQueue.length);
  useEffect(() => {
    if (initialized) return;
    // Check if all items are answered correctly
    const allItemIds = new Set<string>();
    allQuestions.forEach(q => allItemIds.add(q.id));
    passageFills.forEach(p => allItemIds.add(p.id));
    matchingExercises.forEach(m => allItemIds.add(m.id));
    const allAnswered = [...allItemIds].every(id => answeredCorrectly.has(id));
    if (allAnswered) {
      onComplete();
      setInitialized(true);
      return;
    }
    // Extend queue
    const moreIds = generateMoreQueue(allQuestions, passageFills, matchingExercises, answeredCorrectly, answeredIncorrectly);
    const newQueue = [...queue, ...moreIds];
    setQueue(newQueue);
    persistState({ queue: newQueue });
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Word definition lookup (word text → CollectedWord)
  const wordDefMap = useMemo(() => {
    const map = new Map<string, { meaning: string; exampleSentence: string }>();
    for (const w of assignment.collected_words) {
      map.set(w.word.toLowerCase(), { meaning: w.meaning, exampleSentence: w.exampleSentence });
    }
    return map;
  }, [assignment.collected_words]);

  // Lookups
  const questionMap = useMemo(() => {
    const map = new Map<string, PracticeQuestion>();
    for (const q of allQuestions) map.set(q.id, q);
    return map;
  }, [allQuestions]);

  const passageFillMap = useMemo(() => {
    const map = new Map<string, PassageFillExercise>();
    for (const p of passageFills) map.set(p.id, p);
    return map;
  }, [passageFills]);

  const matchingMap = useMemo(() => {
    const map = new Map<string, WordMatchingExercise>();
    for (const m of matchingExercises) map.set(m.id, m);
    return map;
  }, [matchingExercises]);

  // Current queue item
  const currentItemId = queue[currentIndex];
  const currentMCQuestion = currentItemId ? questionMap.get(currentItemId) : undefined;
  const currentPassageFill = currentItemId ? passageFillMap.get(currentItemId) : undefined;
  const currentMatching = currentItemId ? matchingMap.get(currentItemId) : undefined;

  // Shuffled MC options
  const shuffledOptions = useMemo(() => {
    if (!currentMCQuestion) return [];
    return shuffle([...currentMCQuestion.options]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMCQuestion?.id, currentIndex]);

  // Persist state
  const persistState = useCallback(
    (overrides?: Partial<{
      queue: string[];
      currentQueueIndex: number;
      answeredCorrectly: Set<string>;
      answeredIncorrectly: Set<string>;
    }>) => {
      onStateChange({
        allQuestions,
        passageFills,
        matchingExercises,
        basketExercises: [],
        queue: overrides?.queue || queue,
        currentQueueIndex: overrides?.currentQueueIndex ?? currentIndex,
        answeredCorrectly: Array.from(overrides?.answeredCorrectly || answeredCorrectly),
        answeredIncorrectly: Array.from(overrides?.answeredIncorrectly || answeredIncorrectly),
      });
    },
    [allQuestions, passageFills, matchingExercises, queue, currentIndex, answeredCorrectly, answeredIncorrectly, onStateChange]
  );

  // MC Check
  const handleMCCheck = useCallback(() => {
    if (!currentMCQuestion || !selectedOption) return;

    const correct = selectedOption === currentMCQuestion.correctAnswer;
    setIsChecked(true);
    setIsCorrect(correct);

    if (correct) {
      const newCorrect = new Set(answeredCorrectly);
      newCorrect.add(currentMCQuestion.id);
      setAnsweredCorrectly(newCorrect);
      persistState({ answeredCorrectly: newCorrect, currentQueueIndex: currentIndex + 1 });
    } else {
      const newIncorrect = new Set(answeredIncorrectly);
      newIncorrect.add(currentMCQuestion.id);
      setAnsweredIncorrectly(newIncorrect);
      const reinsertOffset = 3 + Math.floor(Math.random() * 3);
      const reinsertPos = Math.min(currentIndex + reinsertOffset, queue.length);
      const newQueue = [...queue];
      newQueue.splice(reinsertPos, 0, currentMCQuestion.id);
      setQueue(newQueue);
      persistState({ queue: newQueue, answeredIncorrectly: newIncorrect, currentQueueIndex: currentIndex + 1 });
    }
  }, [currentMCQuestion, selectedOption, answeredCorrectly, answeredIncorrectly, currentIndex, queue, persistState]);

  // Interactive exercise complete
  const handleInteractiveComplete = useCallback((allCorrect: boolean) => {
    if (!currentItemId) return;

    setIsChecked(true);
    setIsCorrect(allCorrect);

    if (allCorrect) {
      const newCorrect = new Set(answeredCorrectly);
      newCorrect.add(currentItemId);
      setAnsweredCorrectly(newCorrect);
      persistState({ answeredCorrectly: newCorrect, currentQueueIndex: currentIndex + 1 });
    } else {
      const newIncorrect = new Set(answeredIncorrectly);
      newIncorrect.add(currentItemId);
      setAnsweredIncorrectly(newIncorrect);
      const reinsertOffset = 3 + Math.floor(Math.random() * 3);
      const reinsertPos = Math.min(currentIndex + reinsertOffset, queue.length);
      const newQueue = [...queue];
      newQueue.splice(reinsertPos, 0, currentItemId);
      setQueue(newQueue);
      persistState({ queue: newQueue, answeredIncorrectly: newIncorrect, currentQueueIndex: currentIndex + 1 });
    }
  }, [currentItemId, answeredCorrectly, answeredIncorrectly, currentIndex, queue, persistState]);

  // Next
  const handleNext = useCallback(() => {
    setSelectedOption(null);
    setIsChecked(false);
    setIsCorrect(false);

    const allItemIds = new Set<string>();
    allQuestions.forEach(q => allItemIds.add(q.id));
    passageFills.forEach(p => allItemIds.add(p.id));
    matchingExercises.forEach(m => allItemIds.add(m.id));

    const allAnswered = [...allItemIds].every(id => answeredCorrectly.has(id));
    if (allAnswered) {
      onComplete();
      return;
    }

    const nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      const moreIds = generateMoreQueue(allQuestions, passageFills, matchingExercises, answeredCorrectly, answeredIncorrectly);
      const newQueue = [...queue, ...moreIds];
      setQueue(newQueue);
      setCurrentIndex(nextIndex);
      persistState({ queue: newQueue, currentQueueIndex: nextIndex });
    } else {
      setCurrentIndex(nextIndex);
      persistState({ currentQueueIndex: nextIndex });
    }
  }, [allQuestions, passageFills, matchingExercises, answeredCorrectly, answeredIncorrectly, currentIndex, queue, onComplete, persistState]);

  if (!currentItemId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-stone-400">Loading practice...</p>
      </div>
    );
  }

  // --- Feedback banner + Next button (shared by interactive exercises) ---
  const feedbackAndNext = (
    <>
      <div className="mt-4 h-11">
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
            isChecked
              ? isCorrect
                ? 'opacity-100 bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'opacity-100 bg-red-50 text-red-700 border border-red-200'
              : 'opacity-0'
          }`}
        >
          {isChecked && isCorrect ? (
            <><Check className="w-4 h-4" /> Great work!</>
          ) : isChecked ? (
            <><X className="w-4 h-4" /> Some answers were wrong. You&apos;ll see this again.</>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 mt-4 pb-4">
        {isChecked && (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  );

  // --- Render interactive exercises ---
  if (currentPassageFill) {
    return (
      <div className="h-full flex flex-col overflow-y-auto px-3 sm:px-5 lg:px-8 py-6">
        <div className="w-full max-w-3xl mx-auto animate-fade-in" key={`${currentItemId}-${currentIndex}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-stone-400">Exercise {currentIndex + 1}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full text-[11px] font-semibold">
              <PenLine className="w-3 h-3" />
              Passage Fill
            </span>
          </div>
          <PassageFill exercise={currentPassageFill} onComplete={handleInteractiveComplete} />
          {feedbackAndNext}
        </div>
      </div>
    );
  }

  if (currentMatching) {
    return (
      <div className="h-full flex flex-col overflow-y-auto px-3 sm:px-5 lg:px-8 py-6">
        <div className="w-full max-w-3xl mx-auto animate-fade-in" key={`${currentItemId}-${currentIndex}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-stone-400">Exercise {currentIndex + 1}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full text-[11px] font-semibold">
              <ArrowRightLeft className="w-3 h-3" />
              Word Matching
            </span>
          </div>
          <WordMatching exercise={currentMatching} onComplete={handleInteractiveComplete} />
          {feedbackAndNext}
        </div>
      </div>
    );
  }

  // --- MC question ---
  if (!currentMCQuestion) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-stone-400">Loading practice...</p>
      </div>
    );
  }

  const config = TYPE_CONFIG[currentMCQuestion.type];

  return (
    <div className="h-full overflow-y-auto px-3 sm:px-5 lg:px-8 py-6">
      <div className="w-full max-w-xl mx-auto animate-fade-in" key={`${currentMCQuestion.id}-${currentIndex}`}>
        {/* Question counter + type badge */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-medium text-stone-400">
            Question {currentIndex + 1}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full text-[11px] font-semibold">
            {config.icon}
            {config.label}
          </span>
        </div>

        {/* Prompt area */}
        <div className="text-center mb-8">
          {currentMCQuestion.type === 'fill_in_blank' ? (
            <>
              <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-3">
                {config.promptLabel}
              </p>
              <p className="text-lg text-slate-700 leading-relaxed font-serif italic px-4">
                &ldquo;{currentMCQuestion.prompt}&rdquo;
              </p>
            </>
          ) : currentMCQuestion.type === 'matching' ? (
            <>
              <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-3">
                {config.promptLabel}
              </p>
              <p className="text-base text-slate-700 leading-relaxed px-4">
                {currentMCQuestion.prompt}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-2">
                {config.promptLabel}
              </p>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1e1b4b] capitalize">
                {currentMCQuestion.prompt}
              </h2>
            </>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {shuffledOptions.map((option, i) => {
            const isSelected = selectedOption === option;
            const isCorrectOption = isChecked && option === currentMCQuestion.correctAnswer;
            const isIncorrectOption = isChecked && isSelected && option !== currentMCQuestion.correctAnswer;

            return (
              <button
                key={i}
                onClick={() => !isChecked && setSelectedOption(option)}
                disabled={isChecked}
                className={`w-full text-left px-4 py-3 sm:px-5 sm:py-4 rounded-xl border-2 text-sm leading-relaxed transition-all duration-200 ${
                  isCorrectOption
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm'
                    : isIncorrectOption
                    ? 'border-red-400 bg-red-50 text-red-800'
                    : isSelected
                    ? 'border-[#1e1b4b] bg-indigo-50 text-[#1e1b4b]'
                    : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300 hover:shadow-sm'
                } ${isChecked ? 'cursor-default' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex-none w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCorrectOption
                          ? 'bg-emerald-200 text-emerald-700'
                          : isIncorrectOption
                          ? 'bg-red-200 text-red-700'
                          : isSelected
                          ? 'bg-[#1e1b4b] text-white'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className={currentMCQuestion.type === 'mc_synonym' || currentMCQuestion.type === 'matching' || currentMCQuestion.type === 'fill_in_blank' || currentMCQuestion.type === 'grouping' ? 'capitalize' : ''}>
                      {option}
                    </span>
                  </div>
                  {isCorrectOption && <Check className="w-5 h-5 text-emerald-500 flex-none mt-0.5" />}
                  {isIncorrectOption && <X className="w-5 h-5 text-red-500 flex-none mt-0.5" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback banner */}
        <div className="mt-4 h-11">
          <div
            className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
              isChecked
                ? isCorrect
                  ? 'opacity-100 bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'opacity-100 bg-red-50 text-red-700 border border-red-200'
                : 'opacity-0'
            }`}
          >
            {isChecked && isCorrect ? (
              <>
                <Check className="w-4 h-4" />
                Correct! +5 points
              </>
            ) : isChecked ? (
              <>
                <X className="w-4 h-4" />
                Incorrect. You&apos;ll see this again soon.
              </>
            ) : null}
          </div>
        </div>

        {/* Word definitions after check (skip for mc_definition — options ARE definitions) */}
        {isChecked && currentMCQuestion.type !== 'mc_definition' && (
          <div className="mt-3 rounded-xl border border-stone-200/80 bg-stone-50/50 p-4">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3">Word Definitions</p>
            <div className="space-y-2.5">
              {shuffledOptions.map((option) => {
                const key = option.toLowerCase();
                const def = currentMCQuestion.optionDefinitions?.[key] || wordDefMap.get(key)?.meaning;
                const isAnswer = option === currentMCQuestion.correctAnswer;
                return (
                  <div key={option} className="flex items-start gap-2.5">
                    <span className={`flex-none text-sm font-semibold capitalize ${isAnswer ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {option}
                    </span>
                    {def ? (
                      <span className="text-xs text-stone-500 pt-0.5">&mdash; {def}</span>
                    ) : (
                      <span className="text-xs text-stone-400 italic pt-0.5">definition not available</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Check / Next button */}
        <div className="flex items-center justify-center gap-3 mt-4 pb-4">
          {isChecked ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleMCCheck}
              disabled={!selectedOption}
              className="px-8 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1e1b4b]"
            >
              Check
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
