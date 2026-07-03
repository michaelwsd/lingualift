'use client';

import React, { useState } from 'react';
import { Check, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { evaluateWordUsage } from '@/services/api';
import { StationCard } from '../StationCard';
import { SpeakerButton } from '../SpeakerButton';
import { StationProps } from '../stationTypes';

interface Evaluation {
  correct: boolean;
  feedback: string;
  correctedSentence: string;
}

export const UseIt: React.FC<StationProps & { selfPaced?: boolean }> = ({ word, onComplete, selfPaced }) => {
  const [value, setValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(false);

  const cleared = result?.correct === true;

  const submit = async () => {
    if (!value.trim() || checking || cleared) return;
    setChecking(true);
    setError(false);
    setAttempts(a => a + 1);
    try {
      const evaluation = await evaluateWordUsage(word.word, word.meaning, value);
      setResult(evaluation);
    } catch {
      setError(true);
    } finally {
      setChecking(false);
    }
  };

  const retry = () => {
    setResult(null);
    setError(false);
  };

  return (
    <StationCard type="use_it">
      <div className="text-center mb-5">
        <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-2">Write your own sentence using</p>
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-3xl font-serif font-bold text-[#1e1b4b] capitalize">{word.word}</h2>
          <SpeakerButton text={word.word} />
        </div>
        <p className="text-xs text-stone-500 italic mt-2 max-w-sm mx-auto">{word.meaning}</p>
      </div>

      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={cleared}
        rows={3}
        placeholder={`e.g. a sentence that shows you understand “${word.word}”…`}
        className={`w-full text-base leading-relaxed px-4 py-3 rounded-xl border-2 outline-none resize-none transition-all ${
          cleared
            ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
            : 'border-stone-200 bg-white text-slate-800 focus:border-[#1e1b4b]'
        }`}
      />

      {/* Feedback */}
      <div className="min-h-[48px] mt-3">
        {result && (
          <div
            className={`px-4 py-3 rounded-lg text-sm animate-fade-in ${
              result.correct
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <div className="flex items-start gap-2 font-medium">
              {result.correct ? <Check className="w-4 h-4 flex-none mt-0.5" /> : <X className="w-4 h-4 flex-none mt-0.5" />}
              <span>{result.feedback}</span>
            </div>
            {!result.correct && result.correctedSentence && (
              <p className="text-xs text-stone-500 mt-2 pl-6">
                Try: <span className="italic text-slate-600">“{result.correctedSentence}”</span>
              </p>
            )}
          </div>
        )}
        {error && (
          <div className="px-4 py-3 rounded-lg text-sm text-stone-500 bg-stone-50 border border-stone-200">
            Couldn&apos;t check that just now. Try again, or the teacher can mark it below.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 mt-4">
        {cleared ? (
          <button
            onClick={() => onComplete({ attempts, firstTry: attempts === 1 })}
            className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Finish word <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            {result || error ? (
              <button
                onClick={retry}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#1e1b4b] bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
              >
                Rewrite
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!value.trim() || checking}
                className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1e1b4b]"
              >
                {checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : <><Sparkles className="w-4 h-4" /> Check my sentence</>}
              </button>
            )}
            {selfPaced ? (
              // Student mode: after a couple of tries, let them move on (AI can be
              // imperfect) rather than getting stuck. Counts as not-mastered.
              attempts >= 2 && (
                <button
                  onClick={() => onComplete({ attempts: Math.max(attempts, 1), firstTry: false })}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-lg transition-all"
                >
                  Move on <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-300">Teacher</span>
                <button
                  onClick={() => onComplete({ attempts: Math.max(attempts, 1), firstTry: false })}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all"
                >
                  <Check className="w-3.5 h-3.5" /> Accept
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </StationCard>
  );
};
