'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CollectedWord, SynonymExercise } from '@/types';
import { generateSynonyms } from '@/services/api';
import { Loader2, Check, X, RotateCcw, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface SynonymGroupingProps {
  wordGroups: CollectedWord[][];
  cachedExercises: SynonymExercise[] | null;
  onExerciseGenerated: (groupIndex: number, exercise: SynonymExercise) => void;
}

const BASKET_COLORS = [
  { border: 'border-blue-300', bg: 'bg-blue-50', header: 'bg-blue-100 text-blue-800', tag: 'bg-blue-100 text-blue-700 border-blue-200' },
  { border: 'border-emerald-300', bg: 'bg-emerald-50', header: 'bg-emerald-100 text-emerald-800', tag: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { border: 'border-amber-300', bg: 'bg-amber-50', header: 'bg-amber-100 text-amber-800', tag: 'bg-amber-100 text-amber-700 border-amber-200' },
  { border: 'border-purple-300', bg: 'bg-purple-50', header: 'bg-purple-100 text-purple-800', tag: 'bg-purple-100 text-purple-700 border-purple-200' },
  { border: 'border-rose-300', bg: 'bg-rose-50', header: 'bg-rose-100 text-rose-800', tag: 'bg-rose-100 text-rose-700 border-rose-200' },
  { border: 'border-cyan-300', bg: 'bg-cyan-50', header: 'bg-cyan-100 text-cyan-800', tag: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { border: 'border-orange-300', bg: 'bg-orange-50', header: 'bg-orange-100 text-orange-800', tag: 'bg-orange-100 text-orange-700 border-orange-200' },
  { border: 'border-pink-300', bg: 'bg-pink-50', header: 'bg-pink-100 text-pink-800', tag: 'bg-pink-100 text-pink-700 border-pink-200' },
  { border: 'border-lime-300', bg: 'bg-lime-50', header: 'bg-lime-100 text-lime-800', tag: 'bg-lime-100 text-lime-700 border-lime-200' },
  { border: 'border-indigo-300', bg: 'bg-indigo-50', header: 'bg-indigo-100 text-indigo-800', tag: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface GroupState {
  placements: Record<string, number>;
  selectedSynonym: string | null;
  draggedSynonym: string | null;
  checked: boolean;
  results: Record<string, boolean>;
  revealed: boolean;
}

const emptyGroupState = (): GroupState => ({
  placements: {},
  selectedSynonym: null,
  draggedSynonym: null,
  checked: false,
  results: {},
  revealed: false,
});

export const SynonymGrouping: React.FC<SynonymGroupingProps> = ({ wordGroups, cachedExercises, onExerciseGenerated }) => {
  const [currentGroup, setCurrentGroup] = useState(0);
  const [exercises, setExercises] = useState<Record<number, SynonymExercise>>(() => {
    if (!cachedExercises) return {};
    const map: Record<number, SynonymExercise> = {};
    cachedExercises.forEach((e, i) => { map[i] = e; });
    return map;
  });
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [groupStates, setGroupStates] = useState<Record<number, GroupState>>({});

  const exercise = exercises[currentGroup] || null;
  const isLoading = loading[currentGroup] || false;
  const state = groupStates[currentGroup] || emptyGroupState();

  const updateState = useCallback((patch: Partial<GroupState>) => {
    setGroupStates(prev => ({
      ...prev,
      [currentGroup]: { ...(prev[currentGroup] || emptyGroupState()), ...patch },
    }));
  }, [currentGroup]);

  const loadExercise = useCallback(async (groupIdx: number) => {
    if (exercises[groupIdx]) return;
    setLoading(prev => ({ ...prev, [groupIdx]: true }));
    try {
      const words = wordGroups[groupIdx];
      const wordTexts = words.map(w => w.word);
      const result = await generateSynonyms(wordTexts);
      setExercises(prev => ({ ...prev, [groupIdx]: result }));
      onExerciseGenerated(groupIdx, result);
    } catch (error) {
      console.error('Failed to generate synonyms:', error);
    } finally {
      setLoading(prev => ({ ...prev, [groupIdx]: false }));
    }
  }, [wordGroups, exercises, onExerciseGenerated]);

  // Load current group's exercise on mount or group change
  useEffect(() => {
    if (!exercises[currentGroup]) {
      loadExercise(currentGroup);
    }
  }, [currentGroup, exercises, loadExercise]);

  const allSynonyms = useMemo(() => {
    if (!exercise) return [];
    const items: { key: string; text: string; correctGroup: number }[] = [];
    exercise.groups.forEach((group, gi) => {
      group.synonyms.forEach((syn, si) => {
        items.push({ key: `${gi}-${si}`, text: syn, correctGroup: gi });
      });
    });
    return shuffle(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise, currentGroup]);

  const unplacedSynonyms = allSynonyms.filter(s => state.placements[s.key] === undefined);

  const handleSynonymClick = (key: string) => {
    if (state.checked || state.revealed) return;
    updateState({ selectedSynonym: state.selectedSynonym === key ? null : key });
  };

  const handleBasketClick = (basketIndex: number) => {
    if (state.checked || state.revealed || !state.selectedSynonym) return;
    updateState({
      placements: { ...state.placements, [state.selectedSynonym]: basketIndex },
      selectedSynonym: null,
    });
  };

  const handleRemoveFromBasket = (key: string) => {
    if (state.checked || state.revealed) return;
    const next = { ...state.placements };
    delete next[key];
    updateState({ placements: next });
  };

  const handleDragStart = (key: string) => {
    updateState({ draggedSynonym: key });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent, basketIndex: number) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
    if (state.checked || state.revealed || !state.draggedSynonym) return;
    updateState({
      placements: { ...state.placements, [state.draggedSynonym]: basketIndex },
      draggedSynonym: null,
    });
  };

  const handleCheck = () => {
    const newResults: Record<string, boolean> = {};
    allSynonyms.forEach(syn => {
      newResults[syn.key] = state.placements[syn.key] === syn.correctGroup;
    });
    updateState({ results: newResults, checked: true });
  };

  const handleReveal = () => {
    const correct: Record<string, number> = {};
    allSynonyms.forEach(syn => { correct[syn.key] = syn.correctGroup; });
    updateState({ placements: correct, revealed: true, checked: false, results: {}, selectedSynonym: null });
  };

  const handleReset = () => {
    updateState(emptyGroupState());
  };

  const allPlaced = Object.keys(state.placements).length === allSynonyms.length;
  const allCorrect = state.checked && Object.values(state.results).every(v => v);
  const totalGroups = wordGroups.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-400">Generating synonym exercise...</p>
        </div>
      </div>
    );
  }

  if (!exercise) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800 font-serif">Synonym Grouping</h3>
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
          <p className="text-xs text-stone-400">Drag synonyms into the correct word basket</p>
        </div>
      </div>

      {/* Synonym Pool */}
      <div className="mb-5" key={currentGroup}>
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Synonyms</p>
        <div className="flex flex-wrap gap-2 min-h-10 bg-stone-50 rounded-lg p-3 border border-stone-200">
          {unplacedSynonyms.length === 0 && !state.revealed ? (
            <p className="text-xs text-stone-400 italic">All synonyms placed</p>
          ) : (
            unplacedSynonyms.map(syn => (
              <button
                key={syn.key}
                onClick={() => handleSynonymClick(syn.key)}
                draggable
                onDragStart={() => handleDragStart(syn.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-grab active:cursor-grabbing ${
                  state.selectedSynonym === syn.key
                    ? 'bg-[#1e1b4b] text-white shadow-md scale-105'
                    : 'bg-white text-slate-700 border border-stone-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                {syn.text}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Baskets */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3" key={`baskets-${currentGroup}`}>
        {exercise.groups.map((group, gi) => {
          const color = BASKET_COLORS[gi % BASKET_COLORS.length];
          const basketSynonyms = allSynonyms.filter(s => state.placements[s.key] === gi);

          return (
            <div
              key={gi}
              onClick={() => handleBasketClick(gi)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, gi)}
              className={`rounded-xl border-2 ${color.border} ${color.bg} transition-all duration-200 ${
                state.selectedSynonym ? 'ring-2 ring-indigo-200 hover:ring-indigo-400' : ''
              } ${state.revealed ? 'opacity-90' : ''}`}
            >
              <div className={`px-3 py-2 rounded-t-[10px] ${color.header} text-xs font-bold capitalize text-center`}>
                {group.word}
              </div>
              <div className="p-3 min-h-15 flex flex-wrap gap-1.5 items-start">
                {basketSynonyms.length === 0 ? (
                  <p className="text-[10px] text-stone-400 italic w-full text-center py-2">Drop synonyms here</p>
                ) : (
                  basketSynonyms.map(syn => {
                    const isCorrect = state.checked && state.results[syn.key] === true;
                    const isIncorrect = state.checked && state.results[syn.key] === false;

                    return (
                      <button
                        key={syn.key}
                        onClick={(e) => { e.stopPropagation(); handleRemoveFromBasket(syn.key); }}
                        disabled={state.checked || state.revealed}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                          isCorrect ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                          isIncorrect ? 'bg-red-100 text-red-700 border-red-300' :
                          state.revealed ? `${color.tag} border` :
                          `${color.tag} border hover:opacity-80`
                        }`}
                      >
                        {syn.text}
                        {isCorrect && <Check className="w-3 h-3" />}
                        {isIncorrect && <X className="w-3 h-3" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

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
              disabled={!allPlaced}
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
