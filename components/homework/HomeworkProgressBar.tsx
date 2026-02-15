'use client';

import React, { useState, useEffect } from 'react';
import { HomeworkPhase } from '@/types';
import { BookOpen, Zap, Trophy, Check } from 'lucide-react';

interface HomeworkProgressBarProps {
  currentPhase: HomeworkPhase;
  allQuestionsCount: number;
  correctlyAnsweredCount: number;
  onPhaseClick?: (phase: HomeworkPhase) => void;
}

const PHASES: { key: HomeworkPhase; label: string; icon: React.ReactNode }[] = [
  { key: 'vocab_review', label: 'Review', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'practice', label: 'Practice', icon: <Zap className="w-4 h-4" /> },
];

export const HomeworkProgressBar: React.FC<HomeworkProgressBarProps> = ({
  currentPhase,
  allQuestionsCount,
  correctlyAnsweredCount,
  onPhaseClick,
}) => {
  const [animateBar, setAnimateBar] = useState(false);
  const prevCountRef = React.useRef(correctlyAnsweredCount);

  useEffect(() => {
    if (correctlyAnsweredCount !== prevCountRef.current) {
      prevCountRef.current = correctlyAnsweredCount;
      setAnimateBar(true);
      const timer = setTimeout(() => setAnimateBar(false), 600);
      return () => clearTimeout(timer);
    }
  }, [correctlyAnsweredCount]);

  const isCompleted = currentPhase === 'completed';
  const progressPercent = allQuestionsCount > 0
    ? Math.min(100, (correctlyAnsweredCount / allQuestionsCount) * 100)
    : 0;

  const canNavigate = (phaseKey: HomeworkPhase) => {
    if (isCompleted) return false;
    if (phaseKey === currentPhase) return false;
    // Can always go back to review, or forward to practice (once review is done)
    return phaseKey === 'vocab_review' || phaseKey === 'practice';
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-stone-200/50 px-5 lg:px-8 py-4">
      <div className="max-w-2xl mx-auto">
        {/* Phase tabs */}
        <div className="flex items-center justify-center gap-3 mb-3">
          {PHASES.map((phase, i) => {
            const isActive = phase.key === currentPhase;
            const isDone =
              phase.key === 'vocab_review'
                ? currentPhase === 'practice' || isCompleted
                : isCompleted;
            const clickable = canNavigate(phase.key);

            return (
              <React.Fragment key={phase.key}>
                {i > 0 && (
                  <div className={`w-8 h-0.5 rounded-full transition-all duration-500 ${
                    isDone || isActive ? 'bg-[#1e1b4b]' : 'bg-stone-200'
                  }`} />
                )}
                <button
                  onClick={() => clickable && onPhaseClick?.(phase.key)}
                  disabled={!clickable}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-[#1e1b4b] text-white shadow-lg shadow-indigo-900/20 scale-105'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-stone-100 text-stone-400'
                  } ${clickable ? 'cursor-pointer hover:scale-105' : ''}`}
                >
                  {isDone && !isActive ? <Check className="w-3.5 h-3.5" /> : phase.icon}
                  {phase.label}
                </button>
              </React.Fragment>
            );
          })}
          {/* Done pill */}
          <div className={`w-8 h-0.5 rounded-full transition-all duration-500 ${
            isCompleted ? 'bg-emerald-500' : 'bg-stone-200'
          }`} />
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-500 ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-700 animate-bounce-in'
                : 'bg-stone-100 text-stone-400'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Done
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                progressPercent >= 100
                  ? 'bg-linear-to-r from-emerald-500 to-emerald-400'
                  : 'bg-linear-to-r from-[#1e1b4b] via-indigo-500 to-violet-500'
              } ${animateBar ? 'animate-progress-pulse' : ''}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Question count - centered */}
          {currentPhase === 'practice' && allQuestionsCount > 0 && (
            <div className="flex items-center justify-center mt-2">
              <span className="text-[11px] text-stone-400 font-medium">
                {correctlyAnsweredCount} of {allQuestionsCount} correct
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
