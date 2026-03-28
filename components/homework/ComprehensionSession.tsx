'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Passage, ComprehensionQuestion } from '@/types';
import { renderInlineMarkdown, applyInlineMarkdown } from '@/lib/render-markdown';
import { BookOpen, CheckCircle2, Send, Eye, Lightbulb, Trophy, LogOut, Loader2, XCircle, Star } from 'lucide-react';

interface AnswerState {
  answer: string;
  submitted: boolean;
  attempts: number;
  score?: number;
  feedback?: string;
  failed?: boolean;
}

interface ComprehensionSessionProps {
  passage: Passage;
  savedAnswers?: Record<string, AnswerState>;
  onStateChange: (answers: Record<string, AnswerState>) => void;
  onComplete: () => void;
  onExit: () => void;
}

export const ComprehensionSession: React.FC<ComprehensionSessionProps> = ({
  passage,
  savedAnswers,
  onStateChange,
  onComplete,
  onExit,
}) => {
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(savedAnswers || {});
  const [highlightedTexts, setHighlightedTexts] = useState<string[]>([]);
  const [activeQuestionForHighlight, setActiveQuestionForHighlight] = useState<string | null>(null);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedTexts]);

  // Sync answer state to parent via effect (avoids setState-during-render)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onStateChange(answers);
  }, [answers]); // eslint-disable-line react-hooks/exhaustive-deps

  const doneCount = Object.values(answers).filter(a => a.submitted || a.failed).length;
  const allDone = doneCount === passage.questions.length;

  const updateAnswer = useCallback((questionId: string, value: string) => {
    setAnswers(prev => {
      const existing = prev[questionId];
      return {
        ...prev,
        [questionId]: {
          answer: value,
          submitted: existing?.submitted || false,
          attempts: existing?.attempts || 0,
          score: existing?.score,
          feedback: existing?.feedback,
          failed: existing?.failed,
        },
      };
    });
  }, []);

  const submitAnswer = useCallback(async (questionId: string, question: ComprehensionQuestion) => {
    const current = answers[questionId];
    if (!current?.answer.trim() || evaluatingId) return;

    setEvaluatingId(questionId);

    try {
      const res = await fetch('/api/homework/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          modelAnswer: question.answer,
          studentAnswer: current.answer,
        }),
      });

      if (!res.ok) throw new Error('Failed to evaluate');

      const { score, feedback } = await res.json() as { score: number; feedback: string };
      const newAttempts = (current.attempts || 0) + 1;
      const passed = score >= 4;
      const failed = !passed && newAttempts >= 3;

      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          answer: current.answer,
          submitted: passed || failed,
          attempts: newAttempts,
          score,
          feedback,
          failed: failed,
        },
      }));
    } catch {
      // On error, still increment attempt
      const newAttempts = (current.attempts || 0) + 1;
      const failed = newAttempts >= 3;

      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          answer: current.answer,
          submitted: failed,
          attempts: newAttempts,
          score: 0,
          feedback: 'Could not evaluate your answer. Please try again.',
          failed: failed,
        },
      }));
    } finally {
      setEvaluatingId(null);
    }
  }, [answers, evaluatingId]);

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
      return <p key={pIdx} className="mb-5">{renderInlineMarkdown(text.trim(), `p${pIdx}`)}</p>;
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

    return <p key={pIdx} className="mb-5">{applyInlineMarkdown(result, `p${pIdx}`)}</p>;
  };

  const renderScore = (score: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < score ? 'text-amber-400 fill-amber-400' : 'text-stone-200'}`}
        />
      );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Progress bar with exit button */}
      <div className="flex-none px-4 sm:px-6 lg:px-8 py-3 border-b border-stone-200/60 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              title="Save and exit"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-slate-700">Reading Comprehension</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${passage.questions.length > 0 ? (doneCount / passage.questions.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-stone-400 font-medium">
                {doneCount}/{passage.questions.length}
              </span>
            </div>
            {allDone && (
              <button
                onClick={onComplete}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all shadow-sm"
              >
                <Trophy className="w-3.5 h-3.5" />
                Finish
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex gap-5 px-4 sm:px-6 lg:px-8 py-4">
        {/* Left: Passage */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-y-auto custom-scrollbar">
            <div className="p-8 lg:p-12">
              <div className="mb-8 text-center border-b border-stone-200 pb-6">
                <div className="flex items-center justify-center gap-2 text-teal-700 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                  <BookOpen className="w-3 h-3" />
                  {passage.type}
                </div>
                <h1 className="text-3xl lg:text-4xl font-serif font-bold text-slate-900 leading-tight">
                  {passage.title}
                </h1>
              </div>

              <article className="font-serif text-slate-700 text-lg leading-loose">
                {paragraphs.map((para, i) => renderParagraph(para, i))}
              </article>
            </div>
          </div>
        </div>

        {/* Right: Questions */}
        <div className="w-105 lg:w-120 flex flex-col">
          <div className="flex items-center gap-2 mb-3 px-1">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Questions
            </h2>
            <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
              {passage.questions.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
            {passage.questions.map((q, idx) => {
              const current = answers[q.id];
              const isDone = current?.submitted || current?.failed || false;
              const isPassed = isDone && !current?.failed;
              const isFailed = current?.failed || false;
              const answerText = current?.answer || '';
              const isHighlighted = activeQuestionForHighlight === q.id;
              const isEvaluating = evaluatingId === q.id;
              const hasAttempted = (current?.attempts || 0) > 0 && !isDone;
              const attemptsLeft = 3 - (current?.attempts || 0);

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-xl border shadow-sm transition-all duration-300 animate-card-in overflow-hidden ${
                    isPassed
                      ? 'border-emerald-200'
                      : isFailed
                      ? 'border-red-200'
                      : isHighlighted
                      ? 'border-amber-300 shadow-amber-100'
                      : 'border-stone-200/80'
                  }`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Question */}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        isPassed
                          ? 'bg-emerald-100 text-emerald-700'
                          : isFailed
                          ? 'bg-red-100 text-red-700'
                          : 'bg-teal-50 text-teal-700'
                      }`}>
                        {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : isFailed ? <XCircle className="w-3.5 h-3.5" /> : idx + 1}
                      </span>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed pt-0.5">
                        {q.question}
                      </p>
                    </div>

                    {/* Not yet done - show input */}
                    {!isDone ? (
                      <div className="ml-9 space-y-2">
                        {/* Previous attempt feedback */}
                        {hasAttempted && current?.feedback && (
                          <div className="animate-fade-in space-y-2">
                            <div className="flex items-center justify-between">
                              {renderScore(current.score || 0)}
                              <span className="text-[10px] text-stone-400 font-medium">
                                {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left
                              </span>
                            </div>
                            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                              {current.feedback}
                            </div>
                          </div>
                        )}

                        <textarea
                          value={answerText}
                          onChange={e => updateAnswer(q.id, e.target.value)}
                          placeholder="Type your answer here..."
                          rows={3}
                          disabled={isEvaluating}
                          className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg bg-stone-50/50 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all resize-none disabled:opacity-50"
                        />
                        <button
                          onClick={() => submitAnswer(q.id, q)}
                          disabled={!answerText.trim() || isEvaluating}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 disabled:cursor-not-allowed rounded-lg transition-all shadow-sm"
                        >
                          {isEvaluating ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Evaluating...
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              Submit
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="ml-9 space-y-3 animate-fade-in">
                        {/* Score */}
                        <div className="flex items-center gap-2">
                          {renderScore(current?.score || 0)}
                          <span className="text-xs font-medium text-slate-600">
                            {current?.score || 0}/5
                          </span>
                          {isFailed && (
                            <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">
                              Out of attempts
                            </span>
                          )}
                        </div>

                        {/* Feedback */}
                        {current?.feedback && (
                          <div className={`px-3 py-2 rounded-lg text-xs ${
                            isPassed
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                              : 'bg-red-50 border border-red-200 text-red-700'
                          }`}>
                            {current.feedback}
                          </div>
                        )}

                        {/* Student's answer */}
                        <div className="bg-blue-50/60 rounded-lg px-3 py-2.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-1">
                            Your Answer
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{answerText}</p>
                        </div>

                        {/* Model answer */}
                        <div className="bg-stone-50/80 rounded-lg p-3 space-y-3">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3" />
                              Model Answer
                            </div>
                            <div className="text-sm text-slate-800 font-medium leading-relaxed prose prose-sm prose-slate">
                              <ReactMarkdown>{q.answer}</ReactMarkdown>
                            </div>
                          </div>
                          <div className="border-t border-stone-200 pt-3">
                            <div className="flex items-center gap-1.5 mb-1.5 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">
                              <Lightbulb className="w-3 h-3" />
                              Explanation
                            </div>
                            <div className="text-xs text-slate-500 leading-relaxed italic prose prose-xs prose-slate">
                              <ReactMarkdown>{q.explanation}</ReactMarkdown>
                            </div>
                          </div>
                        </div>

                        {/* Show in Passage */}
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
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
