'use client';

import React, { useMemo, useState } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { buildMeaningOptions } from '@/lib/arena';
import { StationCard } from '../StationCard';
import { SpeakerButton } from '../SpeakerButton';
import { StationProps } from '../stationTypes';

export const MeaningMatch: React.FC<StationProps> = ({ word, allWords, onComplete }) => {
  const options = useMemo(() => buildMeaningOptions(word, allWords), [word, allWords]);

  const [selected, setSelected] = useState<string | null>(null);
  const [wrongPicks, setWrongPicks] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [cleared, setCleared] = useState(false);

  const handlePick = (opt: string) => {
    if (cleared || wrongPicks.has(opt)) return;
    setSelected(opt);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (opt === word.meaning) {
      setCleared(true);
    } else {
      setWrongPicks(prev => new Set(prev).add(opt));
      setSelected(null);
    }
  };

  return (
    <StationCard type="meaning">
      <div className="text-center mb-6">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1e1b4b] capitalize">{word.word}</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          {word.phonetic && <span className="text-sm text-stone-400">{word.phonetic}</span>}
          <SpeakerButton text={word.word} />
        </div>
        <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mt-4">What does it mean?</p>
      </div>

      <div className="space-y-2.5">
        {options.map((opt, i) => {
          const isCorrect = cleared && opt === word.meaning;
          const isWrong = wrongPicks.has(opt);
          return (
            <button
              key={i}
              onClick={() => handlePick(opt)}
              disabled={cleared || isWrong}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm leading-relaxed transition-all duration-200 ${
                isCorrect
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm'
                  : isWrong
                  ? 'border-red-200 bg-red-50/60 text-red-400 line-through'
                  : 'border-stone-200 bg-white text-slate-700 hover:border-indigo-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex items-start gap-3">
                  <span
                    className={`flex-none w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCorrect ? 'bg-emerald-200 text-emerald-700' : isWrong ? 'bg-red-100 text-red-400' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </span>
                {isCorrect && <Check className="w-5 h-5 text-emerald-500 flex-none" />}
                {isWrong && <X className="w-4 h-4 text-red-300 flex-none mt-0.5" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="h-11 mt-4">
        {cleared && (
          <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 animate-fade-in">
            <Check className="w-4 h-4" />
            {attempts === 1 ? 'Nailed it!' : 'Correct!'}
          </div>
        )}
      </div>

      {cleared && (
        <div className="flex justify-center mt-2">
          <button
            onClick={() => onComplete({ attempts, firstTry: attempts === 1 })}
            className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </StationCard>
  );
};
