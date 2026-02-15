'use client';

import React from 'react';
import { BookOpen, Brain, Puzzle, Check } from 'lucide-react';

interface StageIndicatorProps {
  currentStage: number;
  stages: { label: string; icon: React.ReactNode }[];
}

const STAGE_CONFIG = [
  { label: 'Reading', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Comprehension', icon: <Brain className="w-4 h-4" /> },
  { label: 'Practice', icon: <Puzzle className="w-4 h-4" /> },
];

export const StageIndicator: React.FC<StageIndicatorProps> = ({ currentStage }) => {
  return (
    <div className="flex items-center justify-center gap-1 py-3 px-4">
      {STAGE_CONFIG.map((stage, idx) => {
        const isCompleted = idx < currentStage;
        const isActive = idx === currentStage;
        const isUpcoming = idx > currentStage;

        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <div className={`w-12 h-px transition-colors duration-500 ${isCompleted ? 'bg-emerald-400' : 'bg-stone-300'}`} />
            )}
            <div className="flex items-center gap-2">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
                ${isCompleted ? 'bg-emerald-500 text-white shadow-sm' : ''}
                ${isActive ? 'bg-[#1e1b4b] text-white shadow-md shadow-indigo-900/30 scale-110' : ''}
                ${isUpcoming ? 'bg-stone-200 text-stone-400' : ''}
              `}>
                {isCompleted ? <Check className="w-4 h-4" /> : stage.icon}
              </div>
              <span className={`text-xs font-semibold tracking-wide transition-colors duration-300 hidden sm:block ${
                isActive ? 'text-[#1e1b4b]' : isCompleted ? 'text-emerald-600' : 'text-stone-400'
              }`}>
                {stage.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
