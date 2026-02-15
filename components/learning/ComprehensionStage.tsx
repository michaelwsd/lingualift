'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Passage, ComprehensionQuestion } from '@/types';
import { ChevronDown, CheckCircle2, Lightbulb, BookOpen, Eye } from 'lucide-react';

interface ComprehensionStageProps {
  passage: Passage;
}

export const ComprehensionStage: React.FC<ComprehensionStageProps> = ({ passage }) => {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [highlightedTexts, setHighlightedTexts] = useState<string[]>([]);
  const [activeQuestionForHighlight, setActiveQuestionForHighlight] = useState<string | null>(null);
  const passageScrollRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedTexts]);

  const handleShowInPassage = (question: ComprehensionQuestion) => {
    if (activeQuestionForHighlight === question.id) {
      setHighlightedTexts([]);
      setActiveQuestionForHighlight(null);
    } else {
      setHighlightedTexts(question.relevantText);
      setActiveQuestionForHighlight(question.id);
    }
  };

  const paragraphs = passage.content.split(/\n\s*\n/).filter(p => p.trim());

  const renderParagraph = (text: string, pIdx: number) => {
    if (highlightedTexts.length === 0) {
      return <p key={pIdx} className="mb-5">{text.trim()}</p>;
    }

    let result: React.ReactNode[] = [text.trim()];

    for (const ht of highlightedTexts) {
      const newResult: React.ReactNode[] = [];
      for (const part of result) {
        if (typeof part !== 'string') {
          newResult.push(part);
          continue;
        }
        const idx = part.toLowerCase().indexOf(ht.toLowerCase());
        if (idx === -1) {
          newResult.push(part);
          continue;
        }
        const before = part.slice(0, idx);
        const match = part.slice(idx, idx + ht.length);
        const after = part.slice(idx + ht.length);
        if (before) newResult.push(before);
        newResult.push(
          <span key={`hl-${pIdx}-${idx}`} ref={highlightRef} className="passage-highlight font-semibold">
            {match}
          </span>
        );
        if (after) newResult.push(after);
      }
      result = newResult;
    }

    return <p key={pIdx} className="mb-5">{result}</p>;
  };

  return (
    <div className="h-full flex gap-5 animate-fade-in">
      {/* Left: Passage */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div
          ref={passageScrollRef}
          className="flex-1 bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-y-auto custom-scrollbar"
        >
          <div className="p-8 lg:p-12">
            <div className="mb-8 text-center border-b border-stone-200 pb-6">
              <div className="flex items-center justify-center gap-2 text-[#1e1b4b] text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                <BookOpen className="w-3 h-3" />
                {passage.type}
              </div>
              <h1 className="text-3xl lg:text-4xl font-serif font-bold text-slate-900 leading-tight">
                {passage.title}
              </h1>
            </div>

            <article className="font-serif text-slate-700 text-lg leading-[2]">
              {paragraphs.map((para, i) => renderParagraph(para, i))}
            </article>
          </div>
        </div>
      </div>

      {/* Right: Questions */}
      <div className="w-[420px] lg:w-[480px] flex flex-col">
        <div className="flex items-center gap-2 mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Questions
          </h2>
          <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
            {passage.questions.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
          {passage.questions.map((q, idx) => {
            const isOpen = openQuestion === q.id;
            const isHighlighted = activeQuestionForHighlight === q.id;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl border shadow-sm transition-all duration-300 animate-card-in overflow-hidden ${
                  isHighlighted ? 'border-amber-300 shadow-amber-100' : 'border-stone-200/80 hover:shadow-md'
                }`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Question Header */}
                <button
                  onClick={() => setOpenQuestion(isOpen ? null : q.id)}
                  className="w-full flex items-start text-left p-4 gap-3 hover:bg-stone-50/50 transition-colors outline-none"
                >
                  <span className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all duration-300 ${
                    isOpen ? 'bg-[#1e1b4b] text-white' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className={`flex-1 text-sm font-medium leading-relaxed pt-0.5 ${isOpen ? 'text-[#1e1b4b]' : 'text-slate-700'}`}>
                    {q.question}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                </button>

                {/* Answer */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-0 animate-fade-in">
                    <div className="ml-9 space-y-3">
                      {/* Show in Passage Button */}
                      <button
                        onClick={() => handleShowInPassage(q)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                          isHighlighted
                            ? 'bg-amber-100 text-amber-700 shadow-sm'
                            : 'bg-stone-100 text-stone-500 hover:bg-amber-50 hover:text-amber-600'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        {isHighlighted ? 'Hide in Passage' : 'Show in Passage'}
                      </button>

                      {/* Answer Box */}
                      <div className="bg-stone-50/80 rounded-lg p-4 space-y-3">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" />
                            Answer
                          </div>
                          <p className="text-sm text-slate-800 font-medium leading-relaxed">{q.answer}</p>
                        </div>
                        <div className="border-t border-stone-200 pt-3">
                          <div className="flex items-center gap-1.5 mb-1.5 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">
                            <Lightbulb className="w-3 h-3" />
                            Explanation
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed italic">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
