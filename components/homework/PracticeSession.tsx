'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  HomeworkAssignment,
  PracticeQuestion,
  PracticeQuestionType,
  PracticeSessionState,
  PassageFillExercise,
  WordMatchingExercise,
  SynonymBasketExercise,
  CollectedWord,
  SynonymGroup,
} from '@/types';
import { generateHomeworkFillInBlank } from '@/services/api';
import { PassageFill } from './PassageFill';
import { WordMatching } from './WordMatching';
import { SynonymBasket } from './SynonymBasket';
import { Check, X, ArrowRight, BookOpen, ListChecks, ArrowRightLeft, PenLine, Layers, Loader2 } from 'lucide-react';

// --- Helpers ---

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pickDistractors(allWords: string[], correctWord: string, count: number): string[] {
  const others = allWords.filter(w => w.toLowerCase() !== correctWord.toLowerCase());
  return shuffle(others).slice(0, count);
}

/** Split items into 2-4 roughly equal groups */
function partitionItems<T>(items: T[]): T[][] {
  const shuffled = shuffle(items);
  const n = shuffled.length;
  if (n === 0) return [];
  if (n <= 3) return [shuffled];

  let numGroups: number;
  if (n <= 10) numGroups = 2;
  else if (n <= 20) numGroups = 3;
  else numGroups = 4;

  numGroups = Math.min(numGroups, n);

  const baseSize = Math.floor(n / numGroups);
  const remainder = n % numGroups;

  const groups: T[][] = [];
  let idx = 0;
  for (let i = 0; i < numGroups; i++) {
    const size = baseSize + (i < remainder ? 1 : 0);
    groups.push(shuffled.slice(idx, idx + size));
    idx += size;
  }
  return groups;
}

// --- Question / Exercise Generation ---

function generateMCQuestions(assignment: HomeworkAssignment): PracticeQuestion[] {
  const questions: PracticeQuestion[] = [];
  const allWordTexts = assignment.collected_words.map(w => w.word);

  for (const q of assignment.mc_definitions) {
    const others = q.options.filter(o => o !== q.correctDefinition);
    questions.push({
      id: `${q.wordId}_mc_definition`,
      wordId: q.wordId,
      type: 'mc_definition',
      prompt: q.word,
      options: shuffle([q.correctDefinition, ...shuffle(others).slice(0, 3)]),
      correctAnswer: q.correctDefinition,
    });
  }

  for (const q of assignment.mc_synonyms) {
    const others = q.options.filter(o => o !== q.correctSynonym);
    questions.push({
      id: `${q.wordId}_mc_synonym`,
      wordId: q.wordId,
      type: 'mc_synonym',
      prompt: q.word,
      options: shuffle([q.correctSynonym, ...shuffle(others).slice(0, 3)]),
      correctAnswer: q.correctSynonym,
    });
  }

  for (const cw of assignment.collected_words) {
    const distractors = pickDistractors(allWordTexts, cw.word, 3);
    questions.push({
      id: `${cw.id}_matching`,
      wordId: cw.id,
      type: 'matching',
      prompt: cw.meaning,
      options: shuffle([cw.word, ...distractors]),
      correctAnswer: cw.word,
    });
  }

  for (const cw of assignment.collected_words) {
    const regex = new RegExp(`\\b${escapeRegex(cw.word)}\\b`, 'gi');
    const blanked = cw.exampleSentence.replace(regex, '______');
    if (blanked !== cw.exampleSentence) {
      const distractors = pickDistractors(allWordTexts, cw.word, 3);
      questions.push({
        id: `${cw.id}_fill_in_blank`,
        wordId: cw.id,
        type: 'fill_in_blank',
        prompt: blanked,
        options: shuffle([cw.word, ...distractors]),
        correctAnswer: cw.word,
      });
    }
  }

  const groupHeaders = assignment.synonym_groups.groups.map(g => g.word);
  if (groupHeaders.length >= 2) {
    for (const group of assignment.synonym_groups.groups) {
      if (group.synonyms.length > 0) {
        const synonym = group.synonyms[Math.floor(Math.random() * group.synonyms.length)];
        const wordEntry = assignment.collected_words.find(
          w => w.word.toLowerCase() === group.word.toLowerCase()
        );
        const wordId = wordEntry?.id || group.word;
        const distractorHeaders = groupHeaders.filter(h => h !== group.word);
        const picked = shuffle(distractorHeaders).slice(0, 3);
        questions.push({
          id: `${wordId}_grouping`,
          wordId,
          type: 'grouping',
          prompt: synonym,
          options: shuffle([group.word, ...picked]),
          correctAnswer: group.word,
        });
      }
    }
  }

  return questions;
}

function generateMatchingExercises(words: CollectedWord[]): WordMatchingExercise[] {
  const groups = partitionItems(words);
  return groups.map((group, i) => ({
    id: `word_matching_${i}`,
    wordIds: group.map(w => w.id),
    words: shuffle(group.map(w => ({ id: w.id, text: w.word }))),
    definitions: shuffle(group.map(w => ({ id: w.id, text: w.meaning }))),
  }));
}

function generateBasketExercises(synGroups: SynonymGroup[], collectedWords: CollectedWord[]): SynonymBasketExercise[] {
  const validGroups = synGroups.filter(g => g.synonyms.length > 0);
  if (validGroups.length < 2) return [];

  const partitions = partitionItems(validGroups);

  return partitions.map((partition, i) => {
    const baskets = partition.map(g => {
      const cw = collectedWords.find(w => w.word.toLowerCase() === g.word.toLowerCase());
      return { id: cw?.id || g.word, word: g.word };
    });

    const synonymPool: { key: string; text: string; correctBasketId: string }[] = [];
    partition.forEach(g => {
      const cw = collectedWords.find(w => w.word.toLowerCase() === g.word.toLowerCase());
      const basketId = cw?.id || g.word;
      const syns = shuffle(g.synonyms).slice(0, Math.min(5, Math.max(3, g.synonyms.length)));
      syns.forEach((syn, j) => {
        synonymPool.push({
          key: `${basketId}_syn_${j}`,
          text: syn,
          correctBasketId: basketId,
        });
      });
    });

    return {
      id: `synonym_basket_${i}`,
      wordIds: partition.map(g => {
        const cw = collectedWords.find(w => w.word.toLowerCase() === g.word.toLowerCase());
        return cw?.id || g.word;
      }),
      baskets,
      synonymPool: shuffle(synonymPool),
    };
  });
}

async function generatePassageFillExercises(words: CollectedWord[], allWordTexts: string[]): Promise<PassageFillExercise[]> {
  const groups = partitionItems(words);
  const exercises: PassageFillExercise[] = [];

  // Generate in parallel
  const results = await Promise.allSettled(
    groups.map(async (group, i) => {
      const wordTexts = group.map(w => w.word);
      const result = await generateHomeworkFillInBlank(wordTexts);
      return {
        id: `passage_fill_${i}`,
        wordIds: group.map(w => w.id),
        passage: result.passage,
        answers: result.answers,
        wordBank: shuffle([...allWordTexts]),
      } as PassageFillExercise;
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled') exercises.push(r.value);
  }

  return exercises;
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
  basketExercises: SynonymBasketExercise[],
  correct: Set<string>,
  incorrect: Set<string>,
): string[] {
  const allItems: QueueItemMeta[] = [];
  questions.forEach(q => allItems.push({ id: q.id, wordIds: [q.wordId] }));
  passageFills.forEach(p => allItems.push({ id: p.id, wordIds: p.wordIds }));
  matchingExercises.forEach(m => allItems.push({ id: m.id, wordIds: m.wordIds }));
  basketExercises.forEach(b => allItems.push({ id: b.id, wordIds: b.wordIds }));

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
  onScoreChange: (newScore: number) => void;
  onStateChange: (state: PracticeSessionState) => void;
  onComplete: (finalScore: number) => void;
}

export const PracticeSession: React.FC<PracticeSessionProps> = ({
  assignment,
  savedState,
  onScoreChange,
  onStateChange,
  onComplete,
}) => {
  const [loading, setLoading] = useState(!savedState);
  const [allQuestions, setAllQuestions] = useState<PracticeQuestion[]>(savedState?.allQuestions || []);
  const [passageFills, setPassageFills] = useState<PassageFillExercise[]>(savedState?.passageFills || []);
  const [matchingExercises, setMatchingExercises] = useState<WordMatchingExercise[]>(savedState?.matchingExercises || []);
  const [basketExercises, setBasketExercises] = useState<SynonymBasketExercise[]>(savedState?.basketExercises || []);
  const [queue, setQueue] = useState<string[]>(savedState?.queue || []);
  const [currentIndex, setCurrentIndex] = useState(savedState?.currentQueueIndex || 0);
  const [score, setScore] = useState(savedState?.score || 0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<Set<string>>(
    () => new Set(savedState?.answeredCorrectly || [])
  );
  const [answeredIncorrectly, setAnsweredIncorrectly] = useState<Set<string>>(
    () => new Set(savedState?.answeredIncorrectly || [])
  );

  // UI state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const initialized = useRef(false);

  // Initialize on mount (generate all exercises)
  useEffect(() => {
    if (initialized.current || savedState) return;
    initialized.current = true;

    const init = async () => {
      const mcQuestions = generateMCQuestions(assignment);
      const matching = generateMatchingExercises(assignment.collected_words);
      const baskets = generateBasketExercises(
        assignment.synonym_groups.groups,
        assignment.collected_words
      );

      const allWordTexts = assignment.collected_words.map(w => w.word);
      const passages = await generatePassageFillExercises(assignment.collected_words, allWordTexts);

      // Build constrained queue
      const queueItems: QueueItemMeta[] = [];
      mcQuestions.forEach(q => queueItems.push({ id: q.id, wordIds: [q.wordId] }));
      passages.forEach(p => queueItems.push({ id: p.id, wordIds: p.wordIds }));
      matching.forEach(m => queueItems.push({ id: m.id, wordIds: m.wordIds }));
      baskets.forEach(b => queueItems.push({ id: b.id, wordIds: b.wordIds }));

      const constrainedQueue = buildConstrainedQueue(queueItems);

      setAllQuestions(mcQuestions);
      setPassageFills(passages);
      setMatchingExercises(matching);
      setBasketExercises(baskets);
      setQueue(constrainedQueue);
      setLoading(false);
    };

    init();
  }, [assignment, savedState]);

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

  const basketMap = useMemo(() => {
    const map = new Map<string, SynonymBasketExercise>();
    for (const b of basketExercises) map.set(b.id, b);
    return map;
  }, [basketExercises]);

  // Current queue item
  const currentItemId = queue[currentIndex];
  const currentMCQuestion = currentItemId ? questionMap.get(currentItemId) : undefined;
  const currentPassageFill = currentItemId ? passageFillMap.get(currentItemId) : undefined;
  const currentMatching = currentItemId ? matchingMap.get(currentItemId) : undefined;
  const currentBasket = currentItemId ? basketMap.get(currentItemId) : undefined;

  // Shuffled MC options
  const shuffledOptions = useMemo(() => {
    if (!currentMCQuestion) return [];
    return shuffle([...currentMCQuestion.options]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMCQuestion?.id, currentIndex]);

  // Total unique items for progress tracking
  const totalUniqueItems = useMemo(() => {
    return allQuestions.length + passageFills.length + matchingExercises.length + basketExercises.length;
  }, [allQuestions.length, passageFills.length, matchingExercises.length, basketExercises.length]);

  // Persist state
  const persistState = useCallback(
    (overrides?: Partial<{
      score: number;
      queue: string[];
      currentQueueIndex: number;
      answeredCorrectly: Set<string>;
      answeredIncorrectly: Set<string>;
    }>) => {
      onStateChange({
        allQuestions,
        passageFills,
        matchingExercises,
        basketExercises,
        queue: overrides?.queue || queue,
        currentQueueIndex: overrides?.currentQueueIndex ?? currentIndex,
        score: overrides?.score ?? score,
        answeredCorrectly: Array.from(overrides?.answeredCorrectly || answeredCorrectly),
        answeredIncorrectly: Array.from(overrides?.answeredIncorrectly || answeredIncorrectly),
      });
    },
    [allQuestions, passageFills, matchingExercises, basketExercises, queue, currentIndex, score, answeredCorrectly, answeredIncorrectly, onStateChange]
  );

  // MC Check
  const handleMCCheck = useCallback(() => {
    if (!currentMCQuestion || !selectedOption) return;

    const correct = selectedOption === currentMCQuestion.correctAnswer;
    setIsChecked(true);
    setIsCorrect(correct);

    if (correct) {
      const newScore = score + 5;
      setScore(newScore);
      onScoreChange(newScore);
      const newCorrect = new Set(answeredCorrectly);
      newCorrect.add(currentMCQuestion.id);
      setAnsweredCorrectly(newCorrect);
      persistState({ score: newScore, answeredCorrectly: newCorrect });
    } else {
      const newIncorrect = new Set(answeredIncorrectly);
      newIncorrect.add(currentMCQuestion.id);
      setAnsweredIncorrectly(newIncorrect);
      const reinsertOffset = 3 + Math.floor(Math.random() * 3);
      const reinsertPos = Math.min(currentIndex + reinsertOffset, queue.length);
      const newQueue = [...queue];
      newQueue.splice(reinsertPos, 0, currentMCQuestion.id);
      setQueue(newQueue);
      persistState({ queue: newQueue, answeredIncorrectly: newIncorrect });
    }
  }, [currentMCQuestion, selectedOption, score, answeredCorrectly, answeredIncorrectly, currentIndex, queue, onScoreChange, persistState]);

  // Interactive exercise complete
  const handleInteractiveComplete = useCallback((allCorrect: boolean) => {
    if (!currentItemId) return;

    setIsChecked(true);
    setIsCorrect(allCorrect);

    if (allCorrect) {
      const newScore = score + 5;
      setScore(newScore);
      onScoreChange(newScore);
      const newCorrect = new Set(answeredCorrectly);
      newCorrect.add(currentItemId);
      setAnsweredCorrectly(newCorrect);
      persistState({ score: newScore, answeredCorrectly: newCorrect });
    } else {
      const newIncorrect = new Set(answeredIncorrectly);
      newIncorrect.add(currentItemId);
      setAnsweredIncorrectly(newIncorrect);
      const reinsertOffset = 3 + Math.floor(Math.random() * 3);
      const reinsertPos = Math.min(currentIndex + reinsertOffset, queue.length);
      const newQueue = [...queue];
      newQueue.splice(reinsertPos, 0, currentItemId);
      setQueue(newQueue);
      persistState({ queue: newQueue, answeredIncorrectly: newIncorrect });
    }
  }, [currentItemId, score, answeredCorrectly, answeredIncorrectly, currentIndex, queue, onScoreChange, persistState]);

  // Next
  const handleNext = useCallback(() => {
    setSelectedOption(null);
    setIsChecked(false);
    setIsCorrect(false);

    const allItemIds = new Set<string>();
    allQuestions.forEach(q => allItemIds.add(q.id));
    passageFills.forEach(p => allItemIds.add(p.id));
    matchingExercises.forEach(m => allItemIds.add(m.id));
    basketExercises.forEach(b => allItemIds.add(b.id));

    const allAnswered = [...allItemIds].every(id => answeredCorrectly.has(id));
    if (allAnswered && score >= 100) {
      onComplete(score);
      return;
    }

    const nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      const moreIds = generateMoreQueue(allQuestions, passageFills, matchingExercises, basketExercises, answeredCorrectly, answeredIncorrectly);
      const newQueue = [...queue, ...moreIds];
      setQueue(newQueue);
      setCurrentIndex(nextIndex);
      persistState({ queue: newQueue, currentQueueIndex: nextIndex });
    } else {
      setCurrentIndex(nextIndex);
      persistState({ currentQueueIndex: nextIndex });
    }
  }, [allQuestions, passageFills, matchingExercises, basketExercises, answeredCorrectly, answeredIncorrectly, score, currentIndex, queue, onComplete, persistState]);

  // --- Loading ---
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-400">Generating exercises...</p>
        </div>
      </div>
    );
  }

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
            <><Check className="w-4 h-4" /> Great work! +5 points</>
          ) : isChecked ? (
            <><X className="w-4 h-4" /> Some answers were wrong. You&apos;ll see this again.</>
          ) : null}
        </div>
      </div>
      {isChecked && (
        <div className="flex justify-center mt-4 pb-4">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );

  // --- Render interactive exercises ---
  if (currentPassageFill) {
    return (
      <div className="h-full flex flex-col overflow-y-auto px-5 lg:px-8 py-6">
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
      <div className="h-full flex flex-col overflow-y-auto px-5 lg:px-8 py-6">
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

  if (currentBasket) {
    return (
      <div className="h-full flex flex-col overflow-y-auto px-5 lg:px-8 py-6">
        <div className="w-full max-w-3xl mx-auto animate-fade-in" key={`${currentItemId}-${currentIndex}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-stone-400">Exercise {currentIndex + 1}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full text-[11px] font-semibold">
              <Layers className="w-3 h-3" />
              Synonym Baskets
            </span>
          </div>
          <SynonymBasket exercise={currentBasket} onComplete={handleInteractiveComplete} />
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
    <div className="h-full flex flex-col items-center justify-center px-5 lg:px-8 py-6">
      <div className="w-full max-w-xl animate-fade-in" key={`${currentMCQuestion.id}-${currentIndex}`}>
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
              <h2 className="text-3xl font-serif font-bold text-[#1e1b4b] capitalize">
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
                className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm leading-relaxed transition-all duration-200 ${
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

        {/* Check / Next button */}
        <div className="flex justify-center mt-4">
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
