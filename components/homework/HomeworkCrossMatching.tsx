'use client';

import React, { useState } from 'react';
import { CrossMatchingData } from '@/types';
import { Check, X } from 'lucide-react';

interface MatchPair {
  wordId: string;
  defId: string;
}

interface HomeworkCrossMatchingProps {
  data: CrossMatchingData;
  savedMatches?: MatchPair[];
  isChecked?: boolean;
  savedResults?: Record<string, boolean>;
  onScore: (delta: number) => void;
  onAnswer: (matches: MatchPair[], results: Record<string, boolean>) => void;
  onComplete: () => void;
}

const PAIR_COLORS = [
  { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700' },
  { border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-700' },
  { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-700' },
  { border: 'border-rose-400', bg: 'bg-rose-50', text: 'text-rose-700' },
  { border: 'border-cyan-400', bg: 'bg-cyan-50', text: 'text-cyan-700' },
  { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700' },
  { border: 'border-pink-400', bg: 'bg-pink-50', text: 'text-pink-700' },
  { border: 'border-lime-400', bg: 'bg-lime-50', text: 'text-lime-700' },
  { border: 'border-indigo-400', bg: 'bg-indigo-50', text: 'text-indigo-700' },
];

export const HomeworkCrossMatching: React.FC<HomeworkCrossMatchingProps> = ({
  data,
  savedMatches,
  isChecked: initialChecked,
  savedResults,
  onScore,
  onAnswer,
  onComplete,
}) => {
  const [matches, setMatches] = useState<MatchPair[]>(savedMatches || []);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [checked, setChecked] = useState(initialChecked || false);
  const [results, setResults] = useState<Record<string, boolean>>(savedResults || {});

  const getMatchForWord = (wordId: string) => matches.find(m => m.wordId === wordId);
  const getMatchForDef = (defId: string) => matches.find(m => m.defId === defId);

  const getColorIndex = (wordId: string) => {
    const idx = matches.findIndex(m => m.wordId === wordId);
    return idx >= 0 ? idx % PAIR_COLORS.length : -1;
  };

  const handleWordClick = (wordId: string) => {
    if (checked) return;
    const existing = getMatchForWord(wordId);
    if (existing) {
      setMatches(prev => prev.filter(m => m.wordId !== wordId));
      return;
    }
    setSelectedWord(wordId);
    if (selectedDef) {
      const existingDef = getMatchForDef(selectedDef);
      if (existingDef) setMatches(prev => prev.filter(m => m.defId !== selectedDef));
      setMatches(prev => [...prev, { wordId, defId: selectedDef }]);
      setSelectedWord(null);
      setSelectedDef(null);
    }
  };

  const handleDefClick = (defId: string) => {
    if (checked) return;
    const existing = getMatchForDef(defId);
    if (existing) {
      setMatches(prev => prev.filter(m => m.defId !== defId));
      return;
    }
    setSelectedDef(defId);
    if (selectedWord) {
      const existingWord = getMatchForWord(selectedWord);
      if (existingWord) setMatches(prev => prev.filter(m => m.wordId !== selectedWord));
      setMatches(prev => [...prev, { wordId: selectedWord, defId }]);
      setSelectedWord(null);
      setSelectedDef(null);
    }
  };

  const handleCheck = () => {
    const newResults: Record<string, boolean> = {};
    let correctCount = 0;
    let incorrectCount = 0;

    matches.forEach(m => {
      const isCorrect = m.wordId === m.defId;
      newResults[m.wordId] = isCorrect;
      if (isCorrect) correctCount++;
      else incorrectCount++;
    });

    setResults(newResults);
    setChecked(true);

    // Score all at once
    const totalDelta = (correctCount * 5) + (incorrectCount * -3);
    onScore(totalDelta);
    onAnswer(matches, newResults);

    // Auto-advance after showing results
    setTimeout(() => {
      onComplete();
    }, 2500);
  };

  const allMatched = matches.length === data.words.length;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-5 lg:px-8 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800 font-serif">Word Matching</h3>
          <p className="text-xs text-stone-400">Click a word, then click its definition</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Words Column */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Words</p>
            {data.words.map(({ id, text }) => {
              const match = getMatchForWord(id);
              const colorIdx = getColorIndex(id);
              const color = colorIdx >= 0 ? PAIR_COLORS[colorIdx] : null;
              const isSelected = selectedWord === id;
              const isCorrect = checked && results[id] === true;
              const isIncorrect = checked && results[id] === false;

              return (
                <button
                  key={id}
                  onClick={() => handleWordClick(id)}
                  disabled={checked && isCorrect}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all duration-200 ${
                    isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-700' :
                    isIncorrect ? 'border-red-400 bg-red-50 text-red-700' :
                    isSelected ? 'border-[#1e1b4b] bg-indigo-50 text-[#1e1b4b] shadow-md scale-[1.02]' :
                    match && color ? `${color.border} ${color.bg} ${color.text}` :
                    'border-stone-200 bg-white text-slate-700 hover:border-stone-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{text}</span>
                    {isCorrect && <Check className="w-4 h-4 text-emerald-500" />}
                    {isIncorrect && <X className="w-4 h-4 text-red-500" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Definitions Column */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Definitions</p>
            {data.definitions.map(({ id, text }) => {
              const match = getMatchForDef(id);
              const colorIdx = match ? getColorIndex(match.wordId) : -1;
              const color = colorIdx >= 0 ? PAIR_COLORS[colorIdx] : null;
              const isSelected = selectedDef === id;
              const isCorrectMatch = checked && match && results[match.wordId] === true;
              const isIncorrectMatch = checked && match && results[match.wordId] === false;

              return (
                <button
                  key={`def-${id}`}
                  onClick={() => handleDefClick(id)}
                  disabled={checked && !!isCorrectMatch}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all duration-200 ${
                    isCorrectMatch ? 'border-emerald-400 bg-emerald-50 text-emerald-700' :
                    isIncorrectMatch ? 'border-red-400 bg-red-50 text-red-700' :
                    isSelected ? 'border-[#1e1b4b] bg-indigo-50 text-[#1e1b4b] shadow-md scale-[1.02]' :
                    match && color ? `${color.border} ${color.bg} ${color.text}` :
                    'border-stone-200 bg-white text-slate-600 hover:border-stone-300 hover:shadow-sm'
                  }`}
                >
                  {text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Check button - no reset, no reveal */}
        {!checked && (
          <div className="flex justify-end mt-5">
            <button
              onClick={handleCheck}
              disabled={!allMatched}
              className="px-5 py-2 text-sm font-medium text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Check Answers
            </button>
          </div>
        )}

        {checked && (
          <div className="mt-4 px-4 py-3 rounded-lg text-sm font-medium animate-fade-in flex items-center gap-2 bg-stone-50 border border-stone-200 text-stone-700">
            <Check className="w-4 h-4" />
            {Object.values(results).filter(v => v).length} of {data.words.length} correct
            — Moving to next exercise...
          </div>
        )}
      </div>
    </div>
  );
};
