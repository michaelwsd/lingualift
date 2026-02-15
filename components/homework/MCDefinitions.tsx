'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MCDefinitionQuestion } from '@/types';
import { Check, X, ArrowRight } from 'lucide-react';

interface MCDefinitionsProps {
  questions: MCDefinitionQuestion[];
  savedAnswers?: Record<string, string>;
  onScore: (delta: number) => void;
  onAnswer: (answers: Record<string, string>) => void;
  onComplete: () => void;
}

export const MCDefinitions: React.FC<MCDefinitionsProps> = ({
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

  // Skip already-answered questions on mount
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
    const correct = option === question.correctDefinition;

    setSelectedOption(option);
    setIsCorrect(correct);
    setShowResult(true);

    const newAnswers = { ...answers, [question.wordId]: option };
    setAnswers(newAnswers);
    onAnswer(newAnswers);
    onScore(correct ? 5 : -3);

    // Auto-advance
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
        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-medium text-stone-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs font-medium text-stone-400">
            Multiple Choice — Definitions
          </span>
        </div>

        {/* Word */}
        <div className="text-center mb-8">
          <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-2">
            What does this word mean?
          </p>
          <h2 className="text-3xl font-serif font-bold text-[#1e1b4b] capitalize">
            {question.word}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {question.options.map((option, i) => {
            const isSelected = selectedOption === option;
            const isCorrectOption = option === question.correctDefinition;
            const showAsCorrect = showResult && isCorrectOption;
            const showAsIncorrect = showResult && isSelected && !isCorrect;

            return (
              <button
                key={i}
                onClick={() => handleSelect(option)}
                disabled={showResult}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm leading-relaxed transition-all duration-200 ${
                  showAsCorrect
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm'
                    : showAsIncorrect
                    ? 'border-red-400 bg-red-50 text-red-800'
                    : isSelected
                    ? 'border-[#1e1b4b] bg-indigo-50 text-[#1e1b4b]'
                    : 'border-stone-200 bg-white text-slate-700 hover:border-stone-300 hover:shadow-sm'
                } ${showResult ? 'cursor-default' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`flex-none w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      showAsCorrect
                        ? 'bg-emerald-200 text-emerald-700'
                        : showAsIncorrect
                        ? 'bg-red-200 text-red-700'
                        : 'bg-stone-100 text-stone-500'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{option}</span>
                  </div>
                  {showAsCorrect && <Check className="w-5 h-5 text-emerald-500 flex-none mt-0.5" />}
                  {showAsIncorrect && <X className="w-5 h-5 text-red-500 flex-none mt-0.5" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Result feedback */}
        {showResult && (
          <div className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium animate-fade-in flex items-center gap-2 ${
            isCorrect
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {isCorrect ? (
              <>
                <Check className="w-4 h-4" />
                Correct!
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                Incorrect.
              </>
            )}
            <ArrowRight className="w-3.5 h-3.5 ml-auto animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};
