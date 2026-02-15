'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CollectedWord } from '@/types';
import { generateHomeworkFillInBlank } from '@/services/api';
import { Loader2, Check, X } from 'lucide-react';

interface HomeworkFillInBlanksProps {
  words: CollectedWord[];
  onScore: (delta: number) => void;
  onAnswer: (results: Record<string, boolean>) => void;
  onComplete: () => void;
}

export const HomeworkFillInBlanks: React.FC<HomeworkFillInBlanksProps> = ({
  words,
  onScore,
  onAnswer,
  onComplete,
}) => {
  const [passage, setPassage] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [placements, setPlacements] = useState<Record<number, string>>({});
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const wordTexts = words.map(w => w.word);
        const data = await generateHomeworkFillInBlank(wordTexts);
        setPassage(data.passage);
        setCorrectAnswers(data.answers);
      } catch (error) {
        console.error('Failed to generate fill-in-blank:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [words]);

  const blankCount = correctAnswers.length;

  // Available words (not yet placed)
  const availableWords = useMemo(() => {
    const placed = new Set(Object.values(placements));
    return correctAnswers.filter(w => !placed.has(w));
  }, [correctAnswers, placements]);

  const handleWordClick = (word: string) => {
    if (checked) return;
    setDraggedWord(draggedWord === word ? null : word);
  };

  const handleBlankClick = (blankIndex: number) => {
    if (checked) return;

    // If blank already has a word, remove it
    if (placements[blankIndex]) {
      setPlacements(prev => {
        const next = { ...prev };
        delete next[blankIndex];
        return next;
      });
      return;
    }

    // Place selected word
    if (draggedWord) {
      // Remove from any other blank first
      setPlacements(prev => {
        const next = { ...prev };
        for (const [key, val] of Object.entries(next)) {
          if (val === draggedWord) delete next[Number(key)];
        }
        next[blankIndex] = draggedWord;
        return next;
      });
      setDraggedWord(null);
    }
  };

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
    if (checked || !draggedWord) return;

    setPlacements(prev => {
      const next = { ...prev };
      for (const [key, val] of Object.entries(next)) {
        if (val === draggedWord) delete next[Number(key)];
      }
      next[blankIndex] = draggedWord;
      return next;
    });
    setDraggedWord(null);
  };

  const handleCheck = () => {
    const newResults: Record<number, boolean> = {};
    let correctCount = 0;
    let incorrectCount = 0;

    for (let i = 0; i < blankCount; i++) {
      const isCorrect = placements[i]?.toLowerCase() === correctAnswers[i]?.toLowerCase();
      newResults[i] = isCorrect;
      if (isCorrect) correctCount++;
      else incorrectCount++;
    }

    setResults(newResults);
    setChecked(true);

    const totalDelta = (correctCount * 5) + (incorrectCount * -3);
    onScore(totalDelta);
    onAnswer(newResults);

    setTimeout(() => {
      onComplete();
    }, 2500);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-400">Generating fill-in-the-blank passage...</p>
          <p className="text-xs text-stone-300 mt-1">A new passage is created each time</p>
        </div>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-stone-400">Failed to generate passage. Please try again.</p>
      </div>
    );
  }

  const allPlaced = Object.keys(placements).length === blankCount;

  // Render passage with blanks
  const renderPassage = () => {
    const parts = passage.split(/(__BLANK_\d+__)/);
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
              : draggedWord
              ? 'border-indigo-300 bg-indigo-50/50 text-stone-400'
              : 'border-stone-300 bg-stone-50 text-stone-400'
          }`}
        >
          {placedWord || '___'}
          {isCorrect && <Check className="w-3 h-3 ml-1" />}
          {isIncorrect && <X className="w-3 h-3 ml-1" />}
        </span>
      );
    });
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-5 lg:px-8 py-6">
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
                    draggedWord === word
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
          <p className="text-sm text-slate-700 leading-[2.2]">
            {renderPassage()}
          </p>
        </div>

        {/* Check button */}
        {!checked && (
          <div className="flex justify-end">
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
          <div className="px-4 py-3 rounded-lg text-sm font-medium animate-fade-in flex items-center gap-2 bg-stone-50 border border-stone-200 text-stone-700">
            <Check className="w-4 h-4" />
            {Object.values(results).filter(v => v).length} of {blankCount} correct
            — Moving to next exercise...
          </div>
        )}
      </div>
    </div>
  );
};
