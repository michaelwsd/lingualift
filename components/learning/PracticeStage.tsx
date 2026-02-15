'use client';

import React, { useMemo } from 'react';
import { CollectedWord, FillInBlankExercise, SynonymExercise } from '@/types';
import { CrossMatching } from './CrossMatching';
import { FillInBlanks } from './FillInBlanks';
import { SynonymGrouping } from './SynonymGrouping';
import { AlertCircle } from 'lucide-react';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function partitionWords(words: CollectedWord[]): CollectedWord[][] {
  const n = words.length;
  if (n <= 7) return [words];

  let numGroups: number;
  if (n <= 14) numGroups = 2;
  else if (n <= 21) numGroups = 3;
  else numGroups = 4;

  const shuffled = shuffle(words);
  const baseSize = Math.floor(n / numGroups);
  const remainder = n % numGroups;

  const groups: CollectedWord[][] = [];
  let idx = 0;
  for (let i = 0; i < numGroups; i++) {
    const size = baseSize + (i < remainder ? 1 : 0);
    groups.push(shuffled.slice(idx, idx + size));
    idx += size;
  }

  // Ensure each group has at least 5 words by borrowing from other groups
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].length < 5) {
      const needed = 5 - groups[i].length;
      const donors = groups.filter((_, j) => j !== i).flat();
      const extra = shuffle(donors).slice(0, needed);
      groups[i] = [...groups[i], ...extra];
    }
  }

  return groups;
}

interface PracticeStageProps {
  collectedWords: CollectedWord[];
  onGoBack: () => void;
  fillInBlankExercises: FillInBlankExercise[] | null;
  onFillInBlankGenerated: (groupIndex: number, exercise: FillInBlankExercise) => void;
  synonymExercises: SynonymExercise[] | null;
  onSynonymGenerated: (groupIndex: number, exercise: SynonymExercise) => void;
}

export const PracticeStage: React.FC<PracticeStageProps> = ({
  collectedWords,
  onGoBack,
  fillInBlankExercises,
  onFillInBlankGenerated,
  synonymExercises,
  onSynonymGenerated,
}) => {
  const wordGroups = useMemo(() => partitionWords(collectedWords), [collectedWords]);

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
          <CrossMatching wordGroups={wordGroups} />
        </div>

        {/* Synonym Grouping */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm p-6 lg:p-8">
          <SynonymGrouping
            wordGroups={wordGroups}
            cachedExercises={synonymExercises}
            onExerciseGenerated={onSynonymGenerated}
          />
        </div>

        {/* Fill in the Blanks */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm p-6 lg:p-8">
          <FillInBlanks
            wordGroups={wordGroups}
            cachedExercises={fillInBlankExercises}
            onExerciseGenerated={onFillInBlankGenerated}
          />
        </div>
      </div>
    </div>
  );
};
