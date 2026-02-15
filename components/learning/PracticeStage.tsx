'use client';

import React from 'react';
import { CollectedWord, FillInBlankExercise, SynonymExercise } from '@/types';
import { CrossMatching } from './CrossMatching';
import { FillInBlanks } from './FillInBlanks';
import { SynonymGrouping } from './SynonymGrouping';
import { AlertCircle } from 'lucide-react';

interface PracticeStageProps {
  collectedWords: CollectedWord[];
  onGoBack: () => void;
  fillInBlankExercise: FillInBlankExercise | null;
  onFillInBlankGenerated: (exercise: FillInBlankExercise) => void;
  synonymExercise: SynonymExercise | null;
  onSynonymGenerated: (exercise: SynonymExercise) => void;
}

export const PracticeStage: React.FC<PracticeStageProps> = ({ collectedWords, onGoBack, fillInBlankExercise, onFillInBlankGenerated, synonymExercise, onSynonymGenerated }) => {
  if (collectedWords.length < 2) {
    return (
      <div className="h-full flex items-center justify-center animate-fade-in">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="text-lg font-serif font-bold text-slate-800 mb-2">Not enough words</h3>
          <p className="text-sm text-stone-400 mb-5 leading-relaxed">
            You need at least 2 vocabulary words to practice. Go back to the reading stage and add more words from the passage.
          </p>
          <button
            onClick={onGoBack}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-lg transition-colors"
          >
            Back to Reading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8 pb-8">
        {/* Cross Matching */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm p-6 lg:p-8">
          <CrossMatching words={collectedWords} />
        </div>

        {/* Synonym Grouping */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm p-6 lg:p-8">
          <SynonymGrouping
            words={collectedWords}
            cachedExercise={synonymExercise}
            onExerciseGenerated={onSynonymGenerated}
          />
        </div>

        {/* Fill in the Blanks */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm p-6 lg:p-8">
          <FillInBlanks
            words={collectedWords}
            cachedExercise={fillInBlankExercise}
            onExerciseGenerated={onFillInBlankGenerated}
          />
        </div>
      </div>
    </div>
  );
};
