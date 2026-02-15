'use client';

import React, { useState, useMemo } from 'react';
import { CollectedWord } from '@/types';
import { Check, X, RotateCcw, Eye } from 'lucide-react';

interface CrossMatchingProps {
  words: CollectedWord[];
}

interface MatchPair {
  wordId: string;
  defId: string;
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const CrossMatching: React.FC<CrossMatchingProps> = ({ words }) => {
  const [matches, setMatches] = useState<MatchPair[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState(false);

  const shuffledWords = useMemo(() => shuffle(words.map(w => ({ id: w.id, text: w.word }))), [words]);
  const shuffledDefs = useMemo(() => shuffle(words.map(w => ({ id: w.id, text: w.meaning }))), [words]);

  const getMatchForWord = (wordId: string) => matches.find(m => m.wordId === wordId);
  const getMatchForDef = (defId: string) => matches.find(m => m.defId === defId);

  const getColorIndex = (wordId: string) => {
    const idx = matches.findIndex(m => m.wordId === wordId);
    return idx >= 0 ? idx % PAIR_COLORS.length : -1;
  };

  const handleWordClick = (wordId: string) => {
    if (checked || revealed) return;
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
    if (checked || revealed) return;
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
    matches.forEach(m => {
      newResults[m.wordId] = m.wordId === m.defId;
    });
    setResults(newResults);
    setChecked(true);
  };

  const handleReveal = () => {
    const correctMatches = words.map(w => ({ wordId: w.id, defId: w.id }));
    setMatches(correctMatches);
    setRevealed(true);
    setChecked(false);
    setResults({});
    setSelectedWord(null);
    setSelectedDef(null);
  };

  const handleReset = () => {
    setMatches([]);
    setSelectedWord(null);
    setSelectedDef(null);
    setChecked(false);
    setResults({});
    setRevealed(false);
  };

  const allCorrect = checked && Object.values(results).every(v => v) && matches.length === words.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800 font-serif">Word Matching</h3>
        <p className="text-xs text-stone-400">Click a word, then click its definition</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Words Column */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Words</p>
          {shuffledWords.map(({ id, text }) => {
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
                disabled={(checked && isCorrect) || revealed}
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
          {shuffledDefs.map(({ id, text }) => {
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
                disabled={(checked && !!isCorrectMatch) || revealed}
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
              All correct!
            </div>
          ) : (
            <button
              onClick={checked ? handleReset : handleCheck}
              disabled={matches.length !== words.length}
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
