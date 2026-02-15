'use client';

import React from 'react';
import { Trophy, Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CompletionScreenProps {
  score: number;
  totalWords: number;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({ score, totalWords }) => {
  const getMessage = () => {
    if (score >= 150) return { text: 'Outstanding!', sub: 'You mastered every exercise!' };
    if (score >= 120) return { text: 'Great job!', sub: 'You have a strong grasp of these words.' };
    if (score >= 100) return { text: 'Well done!', sub: 'You answered all questions correctly.' };
    return { text: 'Keep going!', sub: 'Review the vocabulary and try again.' };
  };

  const msg = getMessage();

  return (
    <div className="h-full flex items-center justify-center px-5 lg:px-8">
      <div className="text-center max-w-md animate-bounce-in">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Trophy className="w-10 h-10 text-amber-500" />
        </div>

        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">{msg.text}</h2>
        <p className="text-sm text-stone-500 mb-6">{msg.sub}</p>

        <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-50 rounded-xl border border-amber-200 mb-8">
          <Star className="w-5 h-5 text-amber-500" />
          <span className="text-lg font-bold text-amber-700">{score} points</span>
        </div>

        <div>
          <Link
            href="/student/homework"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Homework
          </Link>
        </div>
      </div>
    </div>
  );
};
