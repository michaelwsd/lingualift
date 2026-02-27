'use client';

import React, { useState, useMemo } from 'react';
import { PassageFillExercise } from '@/types';
import { Check, X } from 'lucide-react';

interface PassageFillProps {
  exercise: PassageFillExercise;
  onComplete: (allCorrect: boolean) => void;
}

export const PassageFill: React.FC<PassageFillProps> = ({ exercise, onComplete }) => {
  const [placements, setPlacements] = useState<Record<number, string>>({});
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});

  const blankCount = exercise.answers.length;

  const availableWords = useMemo(() => {
    const placed = new Set(Object.values(placements));
    return exercise.wordBank.filter(w => !placed.has(w));
  }, [exercise.wordBank, placements]);

  const handleWordClick = (word: string) => {
    if (checked) return;
    setSelectedWord(selectedWord === word ? null : word);
  };

  const handleBlankClick = (blankIndex: number) => {
    if (checked) return;
    if (placements[blankIndex]) {
      setPlacements(prev => {
        const next = { ...prev };
        delete next[blankIndex];
        return next;
      });
      return;
    }
    if (selectedWord) {
      setPlacements(prev => {
        const next = { ...prev };
        for (const [key, val] of Object.entries(next)) {
          if (val === selectedWord) delete next[Number(key)];
        }
        next[blankIndex] = selectedWord;
        return next;
      });
      setSelectedWord(null);
    }
  };

  const handleDragStart = (word: string) => setSelectedWord(word);
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
    if (checked || !selectedWord) return;
    setPlacements(prev => {
      const next = { ...prev };
      for (const [key, val] of Object.entries(next)) {
        if (val === selectedWord) delete next[Number(key)];
      }
      next[blankIndex] = selectedWord;
      return next;
    });
    setSelectedWord(null);
  };

  const handleCheck = () => {
    const newResults: Record<number, boolean> = {};
    let allCorrect = true;
    for (let i = 0; i < blankCount; i++) {
      const isCorrect = placements[i]?.toLowerCase() === exercise.answers[i]?.toLowerCase();
      newResults[i] = isCorrect;
      if (!isCorrect) allCorrect = false;
    }
    setResults(newResults);
    setChecked(true);
    onComplete(allCorrect);
  };

  const allPlaced = Object.keys(placements).length === blankCount;

  const renderPassage = () => {
    const parts = exercise.passage.split(/(__BLANK_\d+__)/);
    return parts.map((part, i) => {
      const blankMatch = part.match(/__BLANK_(\d+)__/);
      if (!blankMatch) return <span key={i}>{part}</span>;

      const blankIndex = parseInt(blankMatch[1]);
      const placedWord = placements[blankIndex];
      const isCorrect = checked && results[blankIndex] === true;
      const isIncorrect = checked && results[blankIndex] === false;

      return (
        <span
          key={i}
          onClick={() => handleBlankClick(blankIndex)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, blankIndex)}
          className={`inline-flex items-center justify-center min-w-25 mx-1 px-3 py-1 rounded-lg border-2 border-dashed text-sm font-medium transition-all cursor-pointer ${
            isCorrect
              ? 'border-emerald-400 bg-emerald-50 text-emerald-700 border-solid'
              : isIncorrect
              ? 'border-red-400 bg-red-50 text-red-700 border-solid'
              : placedWord
              ? 'border-indigo-300 bg-indigo-50 text-[#1e1b4b] border-solid'
              : selectedWord
              ? 'border-indigo-300 bg-indigo-50/50 text-stone-400'
              : 'border-stone-300 bg-stone-50 text-stone-400'
          }`}
        >
          {isIncorrect ? (
            <span className="inline-flex flex-col items-center gap-0.5">
              <span className="line-through opacity-60">{placedWord}</span>
              <span className="text-emerald-700 font-semibold text-xs">{exercise.answers[blankIndex]}</span>
            </span>
          ) : (
            <>{placedWord || '___'}</>
          )}
          {isCorrect && <Check className="w-3 h-3 ml-1" />}
          {isIncorrect && <X className="w-3 h-3 ml-1" />}
        </span>
      );
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800 font-serif">Fill in the Blanks</h3>
        <p className="text-xs text-stone-400">Drag or click words into the blanks</p>
      </div>

      {/* Word bank */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Word Bank</p>
        <div className="flex flex-wrap gap-2 min-h-10 bg-stone-50 rounded-lg p-3 border border-stone-200">
          {availableWords.length === 0 && !checked ? (
            <p className="text-xs text-stone-400 italic">All words placed</p>
          ) : (
            availableWords.map((word, i) => (
              <button
                key={`${word}-${i}`}
                onClick={() => handleWordClick(word)}
                draggable={!checked}
                onDragStart={() => handleDragStart(word)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-grab active:cursor-grabbing ${
                  selectedWord === word
                    ? 'bg-[#1e1b4b] text-white shadow-md scale-105'
                    : 'bg-white text-slate-700 border border-stone-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                {word}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Passage */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-6 shadow-sm mb-5">
        <p className="text-sm text-slate-700 leading-[2.2]">{renderPassage()}</p>
      </div>

      {/* Check button */}
      {!checked && (
        <div className="flex justify-center">
          <button
            onClick={handleCheck}
            disabled={!allPlaced}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1e1b4b]"
          >
            Check Answers
          </button>
        </div>
      )}

      {checked && (
        <div className="text-center text-sm text-stone-500">
          {Object.values(results).filter(v => v).length} of {blankCount} correct
        </div>
      )}
    </div>
  );
};
