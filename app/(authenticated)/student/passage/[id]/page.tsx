'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { fetchPassage, explainWord } from '@/services/api';
import { Passage } from '@/types';
import { ArrowLeft, BookOpen, Loader2, Lightbulb, X } from 'lucide-react';

interface SelectionPopover {
  text: string;
  context: string;
  x: number;
  y: number;
}

interface ExplanationPopover {
  text: string;
  explanation: string | null;
  isLoading: boolean;
  x: number;
  y: number;
}

export default function PassageReaderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const source = (searchParams.get('source') || 'passage') as 'passage' | 'homework';

  const [passage, setPassage] = useState<Passage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selection, setSelection] = useState<SelectionPopover | null>(null);
  const [explanation, setExplanation] = useState<ExplanationPopover | null>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPassage(id, source)
      .then(setPassage)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, source]);

  // Dismiss popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSelection(null);
        setExplanation(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dismiss popovers on scroll
  useEffect(() => {
    const container = passageRef.current;
    if (!container) return;
    const handleScroll = () => {
      setSelection(null);
      setExplanation(null);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTextSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const text = sel.toString().trim();
    if (!text || text.length > 120 || text.length < 1) return;

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    let context = text;
    if (range.commonAncestorContainer.textContent) {
      const fullText = range.commonAncestorContainer.textContent;
      const start = Math.max(0, fullText.indexOf(text) - 60);
      const end = Math.min(fullText.length, fullText.indexOf(text) + text.length + 60);
      context = fullText.slice(start, end).trim();
    }

    const x = rect.left + rect.width / 2;
    const y = rect.top - 10;

    setExplanation(null);
    setSelection({ text, context, x, y });
  };

  const handleExplain = async () => {
    if (!selection) return;
    const { text, context, x, y } = selection;
    setSelection(null);
    setExplanation({ text, explanation: null, isLoading: true, x, y });

    try {
      const result = await explainWord(text, context);
      setExplanation(prev => prev ? { ...prev, explanation: result.meaning, isLoading: false } : null);
    } catch {
      setExplanation(prev => prev ? { ...prev, explanation: 'Could not explain this word.', isLoading: false } : null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-400">Loading passage...</p>
        </div>
      </div>
    );
  }

  if (error || !passage) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-stone-500 mb-3">Failed to load passage.</p>
          <button
            onClick={() => router.push('/student/homework')}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Back to Homework
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={passageRef} className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-10">
        {/* Back button */}
        <button
          onClick={() => router.push('/student/homework')}
          className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors mb-6 animate-fade-in"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Homework
        </button>

        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-teal-600" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-teal-50 text-teal-700 border-teal-200">
              {passage.type}
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 leading-snug">
            {passage.title}
          </h1>
        </div>

        {/* Passage content */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-8 mb-8 animate-fade-in">
          <article
            className="text-[15px] text-slate-700 leading-[1.85] font-serif space-y-5 selection:bg-amber-100 selection:text-amber-900"
            onMouseUp={handleTextSelection}
          >
            {passage.content
              .split(/\n\n+/)
              .flatMap(block => {
                if (block.length > 400) {
                  const sentences = block.match(/[^.!?]+[.!?]+\s*/g) || [block];
                  const chunks: string[] = [];
                  let current = '';
                  for (const s of sentences) {
                    current += s;
                    if (current.length > 300) {
                      chunks.push(current.trim());
                      current = '';
                    }
                  }
                  if (current.trim()) chunks.push(current.trim());
                  return chunks;
                }
                return [block.trim()];
              })
              .filter(Boolean)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </article>

          {/* Hint */}
          <div className="mt-8 pt-6 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-400 italic">
              Highlight any word or phrase to see its meaning
            </p>
          </div>
        </div>
      </div>

      {/* Selection Popover */}
      {selection && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-9999"
          style={{ left: `${selection.x}px`, top: `${selection.y}px`, transform: 'translate(-50%, -100%)' }}
        >
          <div className="animate-scale-in">
            <div className="bg-white rounded-xl shadow-2xl border border-stone-200 p-1.5 flex items-center gap-1.5">
              <div className="px-2.5 py-1 text-xs font-semibold text-slate-700 max-w-40 truncate border-r border-stone-200">
                &ldquo;{selection.text}&rdquo;
              </div>
              <button
                onClick={handleExplain}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <Lightbulb className="w-3 h-3" />
                Explain
              </button>
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-stone-200 rotate-45" />
          </div>
        </div>,
        document.body
      )}

      {/* Explanation Popover */}
      {explanation && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-9999"
          style={{ left: `${explanation.x}px`, top: `${explanation.y}px`, transform: 'translate(-50%, -100%)' }}
        >
          <div className="animate-scale-in">
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl max-w-72 relative">
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="text-amber-300 font-bold text-sm">&ldquo;{explanation.text}&rdquo;</span>
                <button onClick={() => setExplanation(null)} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {explanation.isLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                </div>
              ) : (
                <p className="text-sm text-slate-200 leading-relaxed">{explanation.explanation}</p>
              )}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
