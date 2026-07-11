'use client';

import React from 'react';
import { CollectedWord } from '@/types';
import { speak } from '@/lib/speak';
import { Volume2, ArrowRight, BookOpen } from 'lucide-react';

interface VocabReviewProps {
  words: CollectedWord[];
  onComplete: () => void;
}

export const VocabReview: React.FC<VocabReviewProps> = ({ words, onComplete }) => {

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex-1 overflow-y-auto custom-scrollbar px-3 sm:px-5 lg:px-8 py-6 select-none"
        onCopy={e => e.preventDefault()}
        onCut={e => e.preventDefault()}
        onContextMenu={e => e.preventDefault()}
        onDragStart={e => e.preventDefault()}
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-7 h-7 text-[#1e1b4b]" />
            </div>
            <h2 className="text-xl font-serif font-bold text-slate-900 mb-1">Review Vocabulary</h2>
            <p className="text-sm text-stone-500">
              Study these {words.length} words before starting the exercises
            </p>
          </div>

          <div className="space-y-3">
            {words.map((word, idx) => (
              <div
                key={word.id}
                className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 animate-card-in"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-slate-900 capitalize font-serif">{word.word}</h3>
                    {word.phonetic && (
                      <span className="text-xs text-stone-400 font-normal">{word.phonetic}</span>
                    )}
                    <button
                      onClick={() => speak(word.word)}
                      className="text-stone-400 hover:text-indigo-600 transition-colors p-0.5"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[10px] font-semibold text-stone-400 bg-stone-100 px-2 py-1 rounded-md uppercase tracking-wider">
                    {idx + 1} / {words.length}
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-3">{word.meaning}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-stone-50 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Example</p>
                    <p className="text-xs text-slate-600 italic leading-relaxed">&ldquo;{word.exampleSentence}&rdquo;</p>
                  </div>
                  <div className="bg-amber-50/60 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Memory Tip</p>
                    <p className="text-xs text-amber-800 leading-relaxed">{word.memoryTip}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-stone-200/60 bg-white/60 backdrop-blur-sm px-3 sm:px-5 lg:px-8 py-3">
        <div className="max-w-2xl mx-auto flex justify-end">
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            I&apos;m Ready — Start Exercises
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
