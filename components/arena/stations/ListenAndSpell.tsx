'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ArrowRight, Eye, Lightbulb } from 'lucide-react';
import { speak } from '@/lib/speak';
import { normalize } from '@/lib/arena';
import { StationCard } from '../StationCard';
import { SpeakerButton } from '../SpeakerButton';
import { StationProps } from '../stationTypes';

export const ListenAndSpell: React.FC<StationProps> = ({ word, onComplete }) => {
  const [value, setValue] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lastGuess, setLastGuess] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-play the word once when the station opens.
  useEffect(() => {
    const t = setTimeout(() => speak(word.word), 250);
    inputRef.current?.focus();
    return () => clearTimeout(t);
  }, [word.word]);

  const check = () => {
    if (!value.trim() || cleared) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (normalize(value) === normalize(word.word)) {
      setCleared(true);
    } else {
      setLastGuess(value);
      if (nextAttempts >= 2) setRevealed(true);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') check();
  };

  // Per-character comparison of the last wrong guess.
  const comparison = lastGuess
    ? word.word.split('').map((ch, i) => {
        const typed = lastGuess[i] ?? '';
        const ok = typed.toLowerCase() === ch.toLowerCase();
        return { ch, typed, ok };
      })
    : null;

  return (
    <StationCard type="spell">
      <div className="flex flex-col items-center mb-6">
        <SpeakerButton text={word.word} size="lg" label="Play the word" />
        <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mt-4">Type what you hear</p>
      </div>

      {/* Meaning hint */}
      <div className="flex items-start gap-2 justify-center text-center mb-5">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-none mt-0.5" />
        <p className="text-xs text-stone-500 italic max-w-sm">{word.meaning}</p>
      </div>

      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKey}
        disabled={cleared}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="type here…"
        className={`w-full text-center text-2xl font-serif tracking-[0.15em] py-4 rounded-xl border-2 outline-none transition-all ${
          cleared
            ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
            : lastGuess
            ? 'border-amber-300 bg-amber-50/40 text-slate-800 focus:border-[#1e1b4b]'
            : 'border-stone-200 bg-white text-slate-800 focus:border-[#1e1b4b]'
        }`}
      />

      {/* Wrong-guess letter feedback */}
      {comparison && !cleared && (
        <div className="flex flex-wrap justify-center gap-1 mt-4 animate-incorrect-flash rounded-lg py-1">
          {comparison.map((c, i) => (
            <span
              key={i}
              className={`w-7 h-9 flex items-center justify-center rounded-md text-base font-bold font-serif ${
                c.ch === ' '
                  ? 'w-3'
                  : c.ok
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {c.ch === ' ' ? '' : revealed ? c.ch : c.ok ? c.typed : '·'}
            </span>
          ))}
        </div>
      )}

      {revealed && !cleared && (
        <p className="text-center text-xs text-stone-400 mt-3 flex items-center justify-center gap-1.5">
          <Eye className="w-3.5 h-3.5" /> The word is <span className="font-bold text-slate-600 capitalize">{word.word}</span>
        </p>
      )}

      {cleared && (
        <div className="px-4 py-3 mt-4 rounded-lg text-sm font-medium flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 animate-fade-in">
          <Check className="w-4 h-4" />
          {attempts === 1 ? 'Spelled it perfectly!' : 'Correct spelling!'}
        </div>
      )}

      <div className="flex justify-center mt-5">
        {cleared ? (
          <button
            onClick={() => onComplete({ attempts, firstTry: attempts === 1 })}
            className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={check}
            disabled={!value.trim()}
            className="px-8 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1e1b4b]"
          >
            Check
          </button>
        )}
      </div>
    </StationCard>
  );
};
