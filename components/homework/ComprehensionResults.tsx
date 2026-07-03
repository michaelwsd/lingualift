'use client';

import React from 'react';
import Link from 'next/link';
import { Passage } from '@/types';
import { Trophy, Star, Target, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

interface AnswerLike {
  answer?: string;
  submitted?: boolean;
  attempts?: number;
  score?: number;
  feedback?: string;
  failed?: boolean;
}

interface ComprehensionResultsProps {
  passage: Passage;
  answers: Record<string, AnswerLike> | undefined;
}

export const ComprehensionResults: React.FC<ComprehensionResultsProps> = ({ passage, answers }) => {
  const questions = passage.questions || [];
  const graded = questions.map((q, i) => {
    const a = answers?.[q.id];
    return { index: i + 1, question: q.question, score: a?.score ?? 0, failed: a?.failed ?? false };
  });

  const totalScore = graded.reduce((s, g) => s + g.score, 0);
  const maxScore = questions.length * 5;
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const strong = graded.filter(g => g.score >= 4);
  const toReview = graded.filter(g => g.score < 4);

  const headline =
    pct >= 85 ? 'Outstanding reading!' : pct >= 65 ? 'Great work!' : pct >= 45 ? 'Good effort!' : 'Keep practising!';

  return (
    <div className="h-full overflow-y-auto custom-scrollbar flex items-center justify-center px-3 sm:px-5 lg:px-8 py-8">
      <div className="w-full max-w-lg animate-scale-in">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
            <Trophy className="w-10 h-10 text-teal-600" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">{headline}</h2>
          <p className="text-sm text-stone-500 mt-1">
            You answered all {questions.length} question{questions.length !== 1 ? 's' : ''} on “{passage.title}”.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-5 sm:p-6">
          <div className="text-center mb-5">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total score</p>
            <p className="text-4xl font-serif font-bold text-teal-700 mt-1">
              {totalScore}<span className="text-2xl text-stone-300"> / {maxScore}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <Stat icon={<Target className="w-4 h-4" />} label="Overall" value={`${pct}%`} accent="text-teal-600 bg-teal-50" />
            <Stat icon={<CheckCircle2 className="w-4 h-4" />} label="Strong answers" value={`${strong.length}/${questions.length}`} accent="text-emerald-600 bg-emerald-50" />
          </div>

          {/* Per-question stars */}
          <div className="mb-5">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">Question breakdown</p>
            <div className="space-y-1.5">
              {graded.map(g => (
                <div key={g.index} className="flex items-center gap-3">
                  <span className="flex-none w-6 h-6 rounded-full bg-stone-100 text-stone-500 text-[11px] font-bold flex items-center justify-center">
                    {g.index}
                  </span>
                  <div className="flex items-center gap-0.5 flex-none">
                    {[0, 1, 2, 3, 4].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s < g.score ? 'text-amber-400 fill-amber-400' : 'text-stone-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-stone-400 truncate">{g.question}</span>
                </div>
              ))}
            </div>
          </div>

          {toReview.length > 0 && (
            <div className="mb-5 rounded-xl bg-amber-50/60 border border-amber-200 p-3.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Worth reviewing
              </p>
              <p className="text-xs text-amber-800">
                Questions {toReview.map(g => g.index).join(', ')} — revisit the passage and the model answers to strengthen these.
              </p>
            </div>
          )}

          <Link
            href="/student/homework"
            className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Homework
          </Link>
        </div>
      </div>
    </div>
  );
};

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl bg-stone-50 border border-stone-200/70 p-3 text-center">
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-1.5 ${accent}`}>{icon}</span>
      <p className="text-lg font-bold text-slate-800 leading-none">{value}</p>
      <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}
