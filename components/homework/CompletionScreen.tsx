'use client';

import React from 'react';
import { Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CompletionScreenProps {
  totalWords: number;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({ totalWords }) => {
  const msg = { text: 'Well done!', sub: `You completed all exercises for ${totalWords} words!` };

  return (
    <div className="h-full flex items-center justify-center px-3 sm:px-5 lg:px-8">
      <div className="text-center max-w-md animate-bounce-in">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Trophy className="w-10 h-10 text-amber-500" />
        </div>

        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">{msg.text}</h2>
        <p className="text-sm text-stone-500 mb-8">{msg.sub}</p>

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
