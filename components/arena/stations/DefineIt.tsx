'use client';

import React, { useState } from 'react';
import { Check, X, ArrowRight, Loader2, Sparkles, Eye } from 'lucide-react';
import { evaluateWordMeaning } from '@/services/api';
import { StationCard } from '../StationCard';
import { SpeakerButton } from '../SpeakerButton';
import { StationProps } from '../stationTypes';

const MAX_ATTEMPTS = 3;

export const DefineIt: React.FC<StationProps> = ({ word, onComplete }) => {
  const [value, setValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; feedback: string } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(false);

  const cleared = result?.correct === true;
  const outOfTries = !cleared && attempts >= MAX_ATTEMPTS && (result !== null || error);
  const triesLeft = MAX_ATTEMPTS - attempts;

  const submit = async () => {
    if (!value.trim() || checking || cleared || outOfTries) return;
    setChecking(true);
    setError(false);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    try {
      const evaluation = await evaluateWordMeaning(word.word, word.meaning, value);
      setResult(evaluation);
    } catch {
      setError(true);
      setResult(null);
    } finally {
      setChecking(false);
    }
  };

  const retry = () => {
    setResult(null);
    setError(false);
  };

  return (
    <StationCard type="define">
      <div className="text-center mb-5">
        <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-2">Explain what this word means</p>
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-3xl font-serif font-bold text-[#1e1b4b] capitalize">{word.word}</h2>
          {word.phonetic && <span className="text-sm text-stone-400">{word.phonetic}</span>}
          <SpeakerButton text={word.word} />
        </div>
        <p className="text-xs text-stone-400 mt-2">Write the meaning in your own words as a full sentence — with correct spelling and grammar.</p>
      </div>

      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={cleared || outOfTries}
        rows={3}
        placeholder={`e.g. "${word.word}" means…`}
        className={`w-full text-base leading-relaxed px-4 py-3 rounded-xl border-2 outline-none resize-none transition-all ${
          cleared
            ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
            : outOfTries
            ? 'border-stone-200 bg-stone-50 text-slate-500'
            : 'border-stone-200 bg-white text-slate-800 focus:border-[#1e1b4b]'
        }`}
      />

      {/* Feedback */}
      <div className="min-h-[48px] mt-3">
        {result && (
          <div
            className={`px-4 py-3 rounded-lg text-sm animate-fade-in flex items-start gap-2 font-medium ${
              result.correct
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {result.correct ? <Check className="w-4 h-4 flex-none mt-0.5" /> : <X className="w-4 h-4 flex-none mt-0.5" />}
            <span>{result.feedback}</span>
          </div>
        )}
        {error && !result && (
          <div className="px-4 py-3 rounded-lg text-sm text-stone-500 bg-stone-50 border border-stone-200">
            Couldn&apos;t check that just now — try again.
          </div>
        )}
        {/* Reveal the meaning once out of tries */}
        {outOfTries && (
          <div className="mt-2 px-4 py-3 rounded-lg bg-stone-50 border border-stone-200 flex items-start gap-2 animate-fade-in">
            <Eye className="w-4 h-4 text-stone-400 flex-none mt-0.5" />
            <p className="text-sm text-slate-600"><span className="font-semibold capitalize">{word.word}</span>: {word.meaning}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-2 mt-4">
        {cleared ? (
          <button
            onClick={() => onComplete({ attempts, firstTry: attempts === 1 })}
            className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : outOfTries ? (
          <button
            onClick={() => onComplete({ attempts: MAX_ATTEMPTS, firstTry: false })}
            className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : result || error ? (
          <>
            <button
              onClick={retry}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#1e1b4b] bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
            >
              Try again
            </button>
            <span className="text-[11px] text-stone-400">{triesLeft} {triesLeft === 1 ? 'try' : 'tries'} left</span>
          </>
        ) : (
          <button
            onClick={submit}
            disabled={!value.trim() || checking}
            className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1e1b4b]"
          >
            {checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : <><Sparkles className="w-4 h-4" /> Check my answer</>}
          </button>
        )}
      </div>
    </StationCard>
  );
};
