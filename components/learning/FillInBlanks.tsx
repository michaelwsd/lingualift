'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CollectedWord, FillInBlankExercise } from '@/types';
import { generateFillInBlank } from '@/services/api';
import { Loader2, Check, X, RotateCcw, RefreshCw, Eye } from 'lucide-react';

interface FillInBlanksProps {
  words: CollectedWord[];
  cachedExercise: FillInBlankExercise | null;
  onExerciseGenerated: (exercise: FillInBlankExercise) => void;
}

export const FillInBlanks: React.FC<FillInBlanksProps> = ({ words, cachedExercise, onExerciseGenerated }) => {
  const [passage, setPassage] = useState(cachedExercise?.passage ?? '');
  const [answers, setAnswers] = useState<string[]>(cachedExercise?.answers ?? []);
  const [placedWords, setPlacedWords] = useState<Record<number, string>>({});
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(!cachedExercise);
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const loadExercise = useCallback(async () => {
    setIsLoading(true);
    setChecked(false);
    setResults({});
    setPlacedWords({});
    setSelectedWord(null);
    try {
      const wordTexts = words.map(w => w.word);
      const result = await generateFillInBlank(wordTexts);
      setPassage(result.passage);
      setAnswers(result.answers);
      onExerciseGenerated(result);
    } catch (error) {
      console.error('Failed to generate fill-in-blank:', error);
    } finally {
      setIsLoading(false);
    }
  }, [words, onExerciseGenerated]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!cachedExercise && words.length > 0) loadExercise();
  }, []);

  // Parse passage into segments
  const segments = passage.split(/(__BLANK_\d+__)/g);
  const blankCount = answers.length;

  // Get available words (not placed anywhere)
  const placedWordValues = Object.values(placedWords);
  const availableWords = words.filter(w => !placedWordValues.includes(w.word));

  const handleWordBankClick = (word: string) => {
    if (checked || revealed) return;
    if (selectedWord === word) {
      setSelectedWord(null);
    } else {
      setSelectedWord(word);
    }
  };

  const handleBlankClick = (blankIndex: number) => {
    if (checked || revealed) return;
    if (placedWords[blankIndex]) {
      // Remove word from blank
      setPlacedWords(prev => {
        const next = { ...prev };
        delete next[blankIndex];
        return next;
      });
      return;
    }
    if (selectedWord) {
      setPlacedWords(prev => ({ ...prev, [blankIndex]: selectedWord }));
      setSelectedWord(null);
    }
  };

  // Drag handlers
  const handleDragStart = (word: string) => {
    setDraggedWord(word);
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
    if (checked || revealed || !draggedWord) return;

    setPlacedWords(prev => ({ ...prev, [blankIndex]: draggedWord }));
    setDraggedWord(null);
  };

  const handleCheck = () => {
    const newResults: Record<number, boolean> = {};
    for (let i = 0; i < blankCount; i++) {
      const placed = placedWords[i];
      const correct = answers[i];
      newResults[i] = placed?.toLowerCase() === correct?.toLowerCase();
    }
    setResults(newResults);
    setChecked(true);
  };

  const handleReveal = () => {
    const correct: Record<number, string> = {};
    answers.forEach((a, i) => { correct[i] = a; });
    setPlacedWords(correct);
    setRevealed(true);
    setChecked(false);
    setResults({});
    setSelectedWord(null);
  };

  const handleReset = () => {
    setPlacedWords({});
    setSelectedWord(null);
    setChecked(false);
    setResults({});
    setRevealed(false);
  };

  const allFilled = Object.keys(placedWords).length === blankCount;
  const allCorrect = checked && Object.values(results).every(v => v);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800 font-serif">Fill in the Blanks</h3>
        <button
          onClick={loadExercise}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          New Passage
        </button>
      </div>

      {/* Word Bank */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Word Bank</p>
        <div className="flex flex-wrap gap-2 min-h-10 bg-stone-50 rounded-lg p-3 border border-stone-200">
          {availableWords.length === 0 && !checked ? (
            <p className="text-xs text-stone-400 italic">All words placed</p>
          ) : (
            availableWords.map(w => (
              <button
                key={w.id}
                onClick={() => handleWordBankClick(w.word)}
                draggable
                onDragStart={() => handleDragStart(w.word)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-grab active:cursor-grabbing ${
                  selectedWord === w.word
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
      <div className="bg-white rounded-xl border border-stone-200 p-6 font-serif text-slate-700 text-base leading-loose">
        {segments.map((seg, i) => {
          const blankMatch = seg.match(/__BLANK_(\d+)__/);
          if (!blankMatch) return <span key={i}>{seg}</span>;

          const blankIndex = parseInt(blankMatch[1]);
          const placed = placedWords[blankIndex];
          const isCorrect = checked && results[blankIndex] === true;
          const isIncorrect = checked && results[blankIndex] === false;

          return (
            <span
              key={i}
              onClick={() => handleBlankClick(blankIndex)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, blankIndex)}
              className={`inline-flex items-center justify-center min-w-24 px-2 py-0.5 mx-1 rounded-md border-2 border-dashed cursor-pointer transition-all duration-200 font-sans text-sm font-medium ${
                revealed ? 'border-indigo-300 bg-indigo-50 text-indigo-700 border-solid' :
                isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-700 border-solid' :
                isIncorrect ? 'border-red-400 bg-red-50 text-red-700 border-solid' :
                placed ? 'border-indigo-300 bg-indigo-50 text-indigo-700 border-solid' :
                selectedWord ? 'border-indigo-400 bg-indigo-50/50 text-stone-400 hover:bg-indigo-50' :
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
      {checked && !allCorrect && (
        <div className="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1">Correct answers:</p>
          <p className="text-xs text-amber-600">
            {answers.map((a, i) => (
              <span key={i}>
                {i > 0 && ', '}
                <span className={results[i] ? 'text-emerald-600' : 'font-bold'}>{a}</span>
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
              disabled={!allFilled}
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
