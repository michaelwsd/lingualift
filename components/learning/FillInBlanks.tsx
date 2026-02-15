'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CollectedWord, FillInBlankExercise } from '@/types';
import { generateFillInBlank } from '@/services/api';
import { Loader2, Check, X, RotateCcw, RefreshCw, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface FillInBlanksProps {
  wordGroups: CollectedWord[][];
  cachedExercises: FillInBlankExercise[] | null;
  onExerciseGenerated: (groupIndex: number, exercise: FillInBlankExercise) => void;
}

interface GroupState {
  placedWords: Record<number, string>;
  selectedWord: string | null;
  draggedWord: string | null;
  checked: boolean;
  results: Record<number, boolean>;
  revealed: boolean;
}

const emptyGroupState = (): GroupState => ({
  placedWords: {},
  selectedWord: null,
  draggedWord: null,
  checked: false,
  results: {},
  revealed: false,
});

export const FillInBlanks: React.FC<FillInBlanksProps> = ({ wordGroups, cachedExercises, onExerciseGenerated }) => {
  const [currentGroup, setCurrentGroup] = useState(0);
  const [exercises, setExercises] = useState<Record<number, FillInBlankExercise>>(() => {
    if (!cachedExercises) return {};
    const map: Record<number, FillInBlankExercise> = {};
    cachedExercises.forEach((e, i) => { map[i] = e; });
    return map;
  });
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [groupStates, setGroupStates] = useState<Record<number, GroupState>>({});

  const exercise = exercises[currentGroup] || null;
  const isLoading = loading[currentGroup] || false;
  const state = groupStates[currentGroup] || emptyGroupState();
  const words = wordGroups[currentGroup];

  const updateState = useCallback((patch: Partial<GroupState>) => {
    setGroupStates(prev => ({
      ...prev,
      [currentGroup]: { ...(prev[currentGroup] || emptyGroupState()), ...patch },
    }));
  }, [currentGroup]);

  const loadExercise = useCallback(async (groupIdx: number, force?: boolean) => {
    if (!force && exercises[groupIdx]) return;
    setLoading(prev => ({ ...prev, [groupIdx]: true }));
    setGroupStates(prev => ({ ...prev, [groupIdx]: emptyGroupState() }));
    try {
      const groupWords = wordGroups[groupIdx];
      const wordTexts = groupWords.map(w => w.word);
      const result = await generateFillInBlank(wordTexts);
      setExercises(prev => ({ ...prev, [groupIdx]: result }));
      onExerciseGenerated(groupIdx, result);
    } catch (error) {
      console.error('Failed to generate fill-in-blank:', error);
    } finally {
      setLoading(prev => ({ ...prev, [groupIdx]: false }));
    }
  }, [wordGroups, exercises, onExerciseGenerated]);

  useEffect(() => {
    if (!exercises[currentGroup]) {
      loadExercise(currentGroup);
    }
  }, [currentGroup, exercises, loadExercise]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-400">Generating exercise...</p>
        </div>
      </div>
    );
  }

  if (!exercise) return null;

  const segments = exercise.passage.split(/(__BLANK_\d+__)/g);
  const blankCount = exercise.answers.length;
  const placedWordValues = Object.values(state.placedWords);
  const availableWords = words.filter(w => !placedWordValues.includes(w.word));
  const allFilled = Object.keys(state.placedWords).length === blankCount;
  const allCorrect = state.checked && Object.values(state.results).every(v => v);
  const totalGroups = wordGroups.length;

  const handleWordBankClick = (word: string) => {
    if (state.checked || state.revealed) return;
    updateState({ selectedWord: state.selectedWord === word ? null : word });
  };

  const handleBlankClick = (blankIndex: number) => {
    if (state.checked || state.revealed) return;
    if (state.placedWords[blankIndex]) {
      const next = { ...state.placedWords };
      delete next[blankIndex];
      updateState({ placedWords: next });
      return;
    }
    if (state.selectedWord) {
      updateState({
        placedWords: { ...state.placedWords, [blankIndex]: state.selectedWord },
        selectedWord: null,
      });
    }
  };

  const handleDragStart = (word: string) => {
    updateState({ draggedWord: word });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent, blankIndex: number) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
    if (state.checked || state.revealed || !state.draggedWord) return;
    updateState({
      placedWords: { ...state.placedWords, [blankIndex]: state.draggedWord },
      draggedWord: null,
    });
  };

  const handleCheck = () => {
    const newResults: Record<number, boolean> = {};
    for (let i = 0; i < blankCount; i++) {
      const placed = state.placedWords[i];
      const correct = exercise.answers[i];
      newResults[i] = placed?.toLowerCase() === correct?.toLowerCase();
    }
    updateState({ results: newResults, checked: true });
  };

  const handleReveal = () => {
    const correct: Record<number, string> = {};
    exercise.answers.forEach((a, i) => { correct[i] = a; });
    updateState({ placedWords: correct, revealed: true, checked: false, results: {}, selectedWord: null });
  };

  const handleReset = () => {
    updateState(emptyGroupState());
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800 font-serif">Fill in the Blanks</h3>
        <div className="flex items-center gap-2">
          {totalGroups > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentGroup(g => g - 1)}
                disabled={currentGroup === 0}
                className="p-1 rounded-md hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-stone-500" />
              </button>
              <span className="text-xs font-medium text-stone-400 min-w-12 text-center">
                {currentGroup + 1} of {totalGroups}
              </span>
              <button
                onClick={() => setCurrentGroup(g => g + 1)}
                disabled={currentGroup === totalGroups - 1}
                className="p-1 rounded-md hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-stone-500" />
              </button>
            </div>
          )}
          <button
            onClick={() => loadExercise(currentGroup, true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            New Passage
          </button>
        </div>
      </div>

      {/* Word Bank */}
      <div className="mb-5" key={`bank-${currentGroup}`}>
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Word Bank</p>
        <div className="flex flex-wrap gap-2 min-h-10 bg-stone-50 rounded-lg p-3 border border-stone-200">
          {availableWords.length === 0 && !state.checked ? (
            <p className="text-xs text-stone-400 italic">All words placed</p>
          ) : (
            availableWords.map(w => (
              <button
                key={w.id}
                onClick={() => handleWordBankClick(w.word)}
                draggable
                onDragStart={() => handleDragStart(w.word)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-grab active:cursor-grabbing ${
                  state.selectedWord === w.word
                    ? 'bg-[#1e1b4b] text-white shadow-md scale-105'
                    : 'bg-white text-slate-700 border border-stone-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                {w.word}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Passage with Blanks */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 font-serif text-slate-700 text-base leading-loose" key={`passage-${currentGroup}`}>
        {segments.map((seg, i) => {
          const blankMatch = seg.match(/__BLANK_(\d+)__/);
          if (!blankMatch) return <span key={i}>{seg}</span>;

          const blankIndex = parseInt(blankMatch[1]);
          const placed = state.placedWords[blankIndex];
          const isCorrect = state.checked && state.results[blankIndex] === true;
          const isIncorrect = state.checked && state.results[blankIndex] === false;

          return (
            <span
              key={i}
              onClick={() => handleBlankClick(blankIndex)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, blankIndex)}
              className={`inline-flex items-center justify-center min-w-24 px-2 py-0.5 mx-1 rounded-md border-2 border-dashed cursor-pointer transition-all duration-200 font-sans text-sm font-medium ${
                state.revealed ? 'border-indigo-300 bg-indigo-50 text-indigo-700 border-solid' :
                isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-700 border-solid' :
                isIncorrect ? 'border-red-400 bg-red-50 text-red-700 border-solid' :
                placed ? 'border-indigo-300 bg-indigo-50 text-indigo-700 border-solid' :
                state.selectedWord ? 'border-indigo-400 bg-indigo-50/50 text-stone-400 hover:bg-indigo-50' :
                'border-stone-300 bg-stone-50 text-stone-400 hover:border-stone-400'
              }`}
            >
              {placed || '___'}
              {isCorrect && <Check className="w-3 h-3 ml-1 text-emerald-500" />}
              {isIncorrect && <X className="w-3 h-3 ml-1 text-red-500" />}
            </span>
          );
        })}
      </div>

      {/* Show correct answers after checking */}
      {state.checked && !allCorrect && (
        <div className="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1">Correct answers:</p>
          <p className="text-xs text-amber-600">
            {exercise.answers.map((a, i) => (
              <span key={i}>
                {i > 0 && ', '}
                <span className={state.results[i] ? 'text-emerald-600' : 'font-bold'}>{a}</span>
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>

        <div className="flex items-center gap-2">
          {!state.revealed && !allCorrect && (
            <button
              onClick={handleReveal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-700 border border-stone-200 hover:border-stone-300 rounded-lg transition-colors"
            >
              <Eye className="w-3 h-3" />
              Reveal
            </button>
          )}

          {state.revealed ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg">
              <Eye className="w-4 h-4" />
              Answers revealed
            </div>
          ) : allCorrect ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
              <Check className="w-4 h-4" />
              Perfect!
            </div>
          ) : (
            <button
              onClick={state.checked ? handleReset : handleCheck}
              disabled={!allFilled}
              className="px-5 py-2 text-sm font-medium text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {state.checked ? 'Try Again' : 'Check Answers'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
