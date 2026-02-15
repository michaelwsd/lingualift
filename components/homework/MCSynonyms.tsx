'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MCSynonymQuestion } from '@/types';
import { Check, X, ArrowRight } from 'lucide-react';

interface MCSynonymsProps {
  questions: MCSynonymQuestion[];
  savedAnswers?: Record<string, string>;
  onScore: (delta: number) => void;
  onAnswer: (answers: Record<string, string>) => void;
  onComplete: () => void;
}

export const MCSynonyms: React.FC<MCSynonymsProps> = ({
  questions,
  savedAnswers,
  onScore,
  onAnswer,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers || {});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (savedAnswers) {
      const firstUnanswered = questions.findIndex(q => !savedAnswers[q.wordId]);
      if (firstUnanswered === -1) {
        onComplete();
      } else {
        setCurrentIndex(firstUnanswered);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((option: string) => {
    if (showResult) return;

    const question = questions[currentIndex];
    const correct = option === question.correctSynonym;

    setSelectedOption(option);
    setIsCorrect(correct);
    setShowResult(true);

    const newAnswers = { ...answers, [question.wordId]: option };
    setAnswers(newAnswers);
    onAnswer(newAnswers);
    onScore(correct ? 5 : -3);

    const delay = correct ? 1000 : 2000;
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setShowResult(false);
        setIsCorrect(false);
      } else {
        onComplete();
      }
    }, delay);
  }, [showResult, questions, currentIndex, answers, onAnswer, onScore, onComplete]);

  if (questions.length === 0) return null;

  const question = questions[currentIndex];

  return (
    <div className="h-full flex flex-col items-center justify-center px-5 lg:px-8 py-6">
      <div className="w-full max-w-xl animate-fade-in" key={currentIndex}>
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-medium text-stone-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs font-medium text-stone-400">
            Multiple Choice — Synonyms
          </span>
        </div>

        <div className="text-center mb-8">
          <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-2">
            Which word is a synonym of
          </p>
          <h2 className="text-3xl font-serif font-bold text-[#1e1b4b] capitalize">
            {question.word}
          </h2>
        </div>

        <div className="space-y-2.5">
          {question.options.map((option, i) => {
            const isSelected = selectedOption === option;
            const isCorrectOption = option === question.correctSynonym;
            const showAsCorrect = showResult && isCorrectOption;
            const showAsIncorrect = showResult && isSelected && !isCorrect;

            return (
              <button
                key={i}
                onClick={() => handleSelect(option)}
                disabled={showResult}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                  showAsCorrect
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm'
                    : showAsIncorrect
                    ? 'border-red-400 bg-red-50 text-red-800'
                    : isSelected
                    ? 'border-[#1e1b4b] bg-indigo-50 text-[#1e1b4b]'
                    : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300 hover:shadow-sm'
                } ${showResult ? 'cursor-default' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex-none w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      showAsCorrect
                        ? 'bg-emerald-200 text-emerald-700'
                        : showAsIncorrect
                        ? 'bg-red-200 text-red-700'
                        : 'bg-stone-100 text-stone-500'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="capitalize">{option}</span>
                  </div>
                  {showAsCorrect && <Check className="w-5 h-5 text-emerald-500 flex-none" />}
                  {showAsIncorrect && <X className="w-5 h-5 text-red-500 flex-none" />}
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium animate-fade-in flex items-center gap-2 ${
            isCorrect
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {isCorrect ? (
              <>
                <Check className="w-4 h-4" />
                Correct! +5 points
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                Incorrect. -3 points
              </>
            )}
            <ArrowRight className="w-3.5 h-3.5 ml-auto animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};
