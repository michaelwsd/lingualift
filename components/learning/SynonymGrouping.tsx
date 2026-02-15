'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CollectedWord, SynonymExercise } from '@/types';
import { generateSynonyms } from '@/services/api';
import { Loader2, Check, X, RotateCcw, Eye } from 'lucide-react';

interface SynonymGroupingProps {
  words: CollectedWord[];
  cachedExercise: SynonymExercise | null;
  onExerciseGenerated: (exercise: SynonymExercise) => void;
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

export const SynonymGrouping: React.FC<SynonymGroupingProps> = ({ words, cachedExercise, onExerciseGenerated }) => {
  const [exercise, setExercise] = useState<SynonymExercise | null>(cachedExercise);
  const [isLoading, setIsLoading] = useState(!cachedExercise);
  // placements: synonymKey -> basketIndex (which word basket it's in)
  const [placements, setPlacements] = useState<Record<string, number>>({});
  const [draggedSynonym, setDraggedSynonym] = useState<string | null>(null);
  const [selectedSynonym, setSelectedSynonym] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState(false);

  const loadExercise = useCallback(async () => {
    setIsLoading(true);
    setChecked(false);
    setRevealed(false);
    setResults({});
    setPlacements({});
    setSelectedSynonym(null);
    try {
      const wordTexts = words.map(w => w.word);
      const result = await generateSynonyms(wordTexts);
      setExercise(result);
      onExerciseGenerated(result);
    } catch (error) {
      console.error('Failed to generate synonyms:', error);
    } finally {
      setIsLoading(false);
    }
  }, [words, onExerciseGenerated]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!cachedExercise && words.length > 0) loadExercise();
  }, []);

  // Build a flat shuffled list of all synonyms with their correct group index
  const allSynonyms = useMemo(() => {
    if (!exercise) return [];
    const items: { key: string; text: string; correctGroup: number }[] = [];
    exercise.groups.forEach((group, gi) => {
      group.synonyms.forEach((syn, si) => {
        items.push({ key: `${gi}-${si}`, text: syn, correctGroup: gi });
      });
    });
    return shuffle(items);
  }, [exercise]);

  // Synonyms not yet placed in any basket
  const unplacedSynonyms = allSynonyms.filter(s => placements[s.key] === undefined);

  const handleSynonymClick = (key: string) => {
    if (checked || revealed) return;
    setSelectedSynonym(selectedSynonym === key ? null : key);
  };

  const handleBasketClick = (basketIndex: number) => {
    if (checked || revealed || !selectedSynonym) return;
    setPlacements(prev => ({ ...prev, [selectedSynonym]: basketIndex }));
    setSelectedSynonym(null);
  };

  const handleRemoveFromBasket = (key: string) => {
    if (checked || revealed) return;
    setPlacements(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Drag handlers
  const handleDragStart = (key: string) => {
    setDraggedSynonym(key);
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
    if (checked || revealed || !draggedSynonym) return;
    setPlacements(prev => ({ ...prev, [draggedSynonym]: basketIndex }));
    setDraggedSynonym(null);
  };

  const handleCheck = () => {
    const newResults: Record<string, boolean> = {};
    allSynonyms.forEach(syn => {
      const placed = placements[syn.key];
      newResults[syn.key] = placed === syn.correctGroup;
    });
    setResults(newResults);
    setChecked(true);
  };

  const handleReveal = () => {
    // Place all synonyms in their correct baskets
    const correct: Record<string, number> = {};
    allSynonyms.forEach(syn => {
      correct[syn.key] = syn.correctGroup;
    });
    setPlacements(correct);
    setRevealed(true);
    setChecked(false);
    setResults({});
  };

  const handleReset = () => {
    setPlacements({});
    setSelectedSynonym(null);
    setChecked(false);
    setResults({});
    setRevealed(false);
  };

  const allPlaced = Object.keys(placements).length === allSynonyms.length;
  const allCorrect = checked && Object.values(results).every(v => v);

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
        <p className="text-xs text-stone-400">Drag synonyms into the correct word basket</p>
      </div>

      {/* Synonym Pool */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Synonyms</p>
        <div className="flex flex-wrap gap-2 min-h-[40px] bg-stone-50 rounded-lg p-3 border border-stone-200">
          {unplacedSynonyms.length === 0 && !revealed ? (
            <p className="text-xs text-stone-400 italic">All synonyms placed</p>
          ) : (
            unplacedSynonyms.map(syn => (
              <button
                key={syn.key}
                onClick={() => handleSynonymClick(syn.key)}
                draggable
                onDragStart={() => handleDragStart(syn.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-grab active:cursor-grabbing ${
                  selectedSynonym === syn.key
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {exercise.groups.map((group, gi) => {
          const color = BASKET_COLORS[gi % BASKET_COLORS.length];
          const basketSynonyms = allSynonyms.filter(s => placements[s.key] === gi);

          return (
            <div
              key={gi}
              onClick={() => handleBasketClick(gi)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, gi)}
              className={`rounded-xl border-2 ${color.border} ${color.bg} transition-all duration-200 ${
                selectedSynonym ? 'ring-2 ring-indigo-200 hover:ring-indigo-400' : ''
              } ${revealed ? 'opacity-90' : ''}`}
            >
              <div className={`px-3 py-2 rounded-t-[10px] ${color.header} text-xs font-bold capitalize text-center`}>
                {group.word}
              </div>
              <div className="p-3 min-h-[60px] flex flex-wrap gap-1.5 items-start">
                {basketSynonyms.length === 0 ? (
                  <p className="text-[10px] text-stone-400 italic w-full text-center py-2">Drop synonyms here</p>
                ) : (
                  basketSynonyms.map(syn => {
                    const isCorrect = checked && results[syn.key] === true;
                    const isIncorrect = checked && results[syn.key] === false;

                    return (
                      <button
                        key={syn.key}
                        onClick={(e) => { e.stopPropagation(); handleRemoveFromBasket(syn.key); }}
                        disabled={checked || revealed}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                          isCorrect ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                          isIncorrect ? 'bg-red-100 text-red-700 border-red-300' :
                          revealed ? `${color.tag} border` :
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
          {!revealed && !allCorrect && (
            <button
              onClick={handleReveal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-700 border border-stone-200 hover:border-stone-300 rounded-lg transition-colors"
            >
              <Eye className="w-3 h-3" />
              Reveal
            </button>
          )}

          {revealed ? (
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
              onClick={checked ? handleReset : handleCheck}
              disabled={!allPlaced}
              className="px-5 py-2 text-sm font-medium text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {checked ? 'Try Again' : 'Check Answers'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
