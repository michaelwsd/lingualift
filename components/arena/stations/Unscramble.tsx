'use client';

import React, { useMemo, useState } from 'react';
import { Check, X, ArrowRight, RotateCcw, Delete } from 'lucide-react';
import { scrambleWord, LetterTile, normalize } from '@/lib/arena';
import { StationCard } from '../StationCard';
import { SpeakerButton } from '../SpeakerButton';
import { StationProps } from '../stationTypes';

export const Unscramble: React.FC<StationProps> = ({ word, onComplete }) => {
  const target = useMemo(() => word.word.replace(/\s+/g, ''), [word.word]);
  const initialTiles = useMemo(() => scrambleWord(target), [target]);

  const [pool, setPool] = useState<LetterTile[]>(initialTiles);
  const [answer, setAnswer] = useState<LetterTile[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<'building' | 'wrong' | 'cleared'>('building');

  const placeTile = (tile: LetterTile) => {
    if (status === 'cleared') return;
    setPool(p => p.filter(t => t.key !== tile.key));
    setAnswer(a => [...a, tile]);
    setStatus('building');
  };

  const removeTile = (tile: LetterTile) => {
    if (status === 'cleared') return;
    setAnswer(a => a.filter(t => t.key !== tile.key));
    setPool(p => [...p, tile]);
    setStatus('building');
  };

  const backspace = () => {
    if (status === 'cleared' || answer.length === 0) return;
    const last = answer[answer.length - 1];
    removeTile(last);
  };

  const reset = () => {
    setPool(initialTiles);
    setAnswer([]);
    setStatus('building');
  };

  const check = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (normalize(answer.map(t => t.char).join('')) === normalize(target)) {
      setStatus('cleared');
    } else {
      setStatus('wrong');
    }
  };

  const full = answer.length === target.length;

  return (
    <StationCard type="unscramble">
      <div className="flex flex-col items-center mb-5">
        <SpeakerButton text={word.word} label="Hear the word" />
        <p className="text-xs text-stone-500 italic max-w-sm text-center mt-3">{word.meaning}</p>
      </div>

      {/* Answer row */}
      <div
        className={`flex flex-wrap justify-center gap-1.5 min-h-[56px] items-center rounded-xl border-2 border-dashed px-3 py-3 mb-4 transition-colors ${
          status === 'cleared'
            ? 'border-emerald-300 bg-emerald-50/50'
            : status === 'wrong'
            ? 'border-red-300 bg-red-50/40 animate-incorrect-flash'
            : 'border-stone-200 bg-stone-50/50'
        }`}
      >
        {answer.length === 0 ? (
          <span className="text-xs text-stone-300 italic">tap the letters in order</span>
        ) : (
          answer.map(tile => (
            <button
              key={tile.key}
              onClick={() => removeTile(tile)}
              disabled={status === 'cleared'}
              className={`w-10 h-11 rounded-lg text-lg font-bold font-serif uppercase shadow-sm transition-all ${
                status === 'cleared'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#1e1b4b] text-white hover:bg-indigo-800'
              }`}
            >
              {tile.char}
            </button>
          ))
        )}
      </div>

      {/* Pool */}
      <div className="flex flex-wrap justify-center gap-1.5 min-h-[48px] mb-2">
        {pool.map(tile => (
          <button
            key={tile.key}
            onClick={() => placeTile(tile)}
            disabled={status === 'cleared'}
            className="w-10 h-11 rounded-lg text-lg font-bold font-serif uppercase bg-white border-2 border-stone-200 text-slate-700 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            {tile.char}
          </button>
        ))}
      </div>

      {/* Feedback */}
      <div className="min-h-[44px] mt-2">
        {status === 'cleared' && (
          <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 animate-fade-in">
            <Check className="w-4 h-4" /> {attempts === 1 ? 'Unscrambled on the first go!' : 'That’s it!'}
          </div>
        )}
        {status === 'wrong' && (
          <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 animate-fade-in">
            <X className="w-4 h-4" /> Not right yet — rearrange and try again.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-center items-center gap-2 mt-3">
        {status === 'cleared' ? (
          <button
            onClick={() => onComplete({ attempts, firstTry: attempts === 1 })}
            className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              onClick={backspace}
              disabled={answer.length === 0}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all disabled:opacity-40"
            >
              <Delete className="w-4 h-4" />
            </button>
            <button
              onClick={reset}
              disabled={answer.length === 0}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={check}
              disabled={!full}
              className="px-8 py-2.5 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1e1b4b]"
            >
              Check
            </button>
          </>
        )}
      </div>
    </StationCard>
  );
};
