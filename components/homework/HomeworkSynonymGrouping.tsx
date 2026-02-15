'use client';

import React, { useState, useMemo } from 'react';
import { SynonymExercise } from '@/types';
import { Check, X } from 'lucide-react';

interface HomeworkSynonymGroupingProps {
  exercise: SynonymExercise;
  savedPlacements?: Record<string, number>;
  isChecked?: boolean;
  savedResults?: Record<string, boolean>;
  onScore: (delta: number) => void;
  onAnswer: (placements: Record<string, number>, results: Record<string, boolean>) => void;
  onComplete: () => void;
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

export const HomeworkSynonymGrouping: React.FC<HomeworkSynonymGroupingProps> = ({
  exercise,
  savedPlacements,
  isChecked: initialChecked,
  savedResults,
  onScore,
  onAnswer,
  onComplete,
}) => {
  const [placements, setPlacements] = useState<Record<string, number>>(savedPlacements || {});
  const [draggedSynonym, setDraggedSynonym] = useState<string | null>(null);
  const [selectedSynonym, setSelectedSynonym] = useState<string | null>(null);
  const [checked, setChecked] = useState(initialChecked || false);
  const [results, setResults] = useState<Record<string, boolean>>(savedResults || {});

  const allSynonyms = useMemo(() => {
    const items: { key: string; text: string; correctGroup: number }[] = [];
    exercise.groups.forEach((group, gi) => {
      group.synonyms.forEach((syn, si) => {
        items.push({ key: `${gi}-${si}`, text: syn, correctGroup: gi });
      });
    });
    return shuffle(items);
  }, [exercise]);

  const unplacedSynonyms = allSynonyms.filter(s => placements[s.key] === undefined);

  const handleSynonymClick = (key: string) => {
    if (checked) return;
    setSelectedSynonym(selectedSynonym === key ? null : key);
  };

  const handleBasketClick = (basketIndex: number) => {
    if (checked || !selectedSynonym) return;
    setPlacements(prev => ({ ...prev, [selectedSynonym]: basketIndex }));
    setSelectedSynonym(null);
  };

  const handleRemoveFromBasket = (key: string) => {
    if (checked) return;
    setPlacements(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

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
    if (checked || !draggedSynonym) return;
    setPlacements(prev => ({ ...prev, [draggedSynonym]: basketIndex }));
    setDraggedSynonym(null);
  };

  const handleCheck = () => {
    const newResults: Record<string, boolean> = {};
    let correctCount = 0;
    let incorrectCount = 0;

    allSynonyms.forEach(syn => {
      const placed = placements[syn.key];
      const isCorrect = placed === syn.correctGroup;
      newResults[syn.key] = isCorrect;
      if (placed !== undefined) {
        if (isCorrect) correctCount++;
        else incorrectCount++;
      }
    });

    setResults(newResults);
    setChecked(true);

    const totalDelta = (correctCount * 5) + (incorrectCount * -3);
    onScore(totalDelta);
    onAnswer(placements, newResults);

    setTimeout(() => {
      onComplete();
    }, 2500);
  };

  const allPlaced = Object.keys(placements).length === allSynonyms.length;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-5 lg:px-8 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800 font-serif">Synonym Grouping</h3>
          <p className="text-xs text-stone-400">Drag or click synonyms into the correct basket</p>
        </div>

        {/* Synonym Pool */}
        <div className="mb-5">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Synonyms</p>
          <div className="flex flex-wrap gap-2 min-h-10 bg-stone-50 rounded-lg p-3 border border-stone-200">
            {unplacedSynonyms.length === 0 ? (
              <p className="text-xs text-stone-400 italic">All synonyms placed</p>
            ) : (
              unplacedSynonyms.map(syn => (
                <button
                  key={syn.key}
                  onClick={() => handleSynonymClick(syn.key)}
                  draggable={!checked}
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
                }`}
              >
                <div className={`px-3 py-2 rounded-t-[10px] ${color.header} text-xs font-bold capitalize text-center`}>
                  {group.word}
                </div>
                <div className="p-3 min-h-15 flex flex-wrap gap-1.5 items-start">
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
                          disabled={checked}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                            isCorrect ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                            isIncorrect ? 'bg-red-100 text-red-700 border-red-300' :
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

        {/* Check button */}
        {!checked && (
          <div className="flex justify-end mt-5">
            <button
              onClick={handleCheck}
              disabled={!allPlaced}
              className="px-5 py-2 text-sm font-medium text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Check Answers
            </button>
          </div>
        )}

        {checked && (
          <div className="mt-4 px-4 py-3 rounded-lg text-sm font-medium animate-fade-in flex items-center gap-2 bg-stone-50 border border-stone-200 text-stone-700">
            <Check className="w-4 h-4" />
            {Object.values(results).filter(v => v).length} of {allSynonyms.length} correct
            — Moving to next exercise...
          </div>
        )}
      </div>
    </div>
  );
};
