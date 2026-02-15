'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Passage, CollectedWord } from '@/types';
import { explainWord } from '@/services/api';
import { X, Loader2, Plus, BookOpen, Lightbulb, Trash2, Volume2, Sparkles } from 'lucide-react';

interface PassageStageProps {
  passage: Passage;
  collectedWords: CollectedWord[];
  onAddWord: (word: CollectedWord) => void;
  onRemoveWord: (id: string) => void;
}

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

export const PassageStage: React.FC<PassageStageProps> = ({
  passage,
  collectedWords,
  onAddWord,
  onRemoveWord,
}) => {
  const [selection, setSelection] = useState<SelectionPopover | null>(null);
  const [explanation, setExplanation] = useState<ExplanationPopover | null>(null);
  const [isAddingWord, setIsAddingWord] = useState(false);
  const passageRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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

  // Dismiss popovers on scroll so they don't become stale
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

    const x = Math.max(20, Math.min(rect.left + rect.width / 2, window.innerWidth - 20));
    const y = Math.max(10, rect.top - 10);

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

  const handleAddToVocab = async () => {
    if (!selection) return;
    const { text, context } = selection;
    setIsAddingWord(true);
    setSelection(null);

    try {
      const result = await explainWord(text, context);
      const newWord: CollectedWord = {
        id: crypto.randomUUID(),
        word: text,
        meaning: result.meaning,
        exampleSentence: result.exampleSentence,
        memoryTip: result.memoryTip,
      };
      onAddWord(newWord);
    } catch (error) {
      console.error('Failed to add word:', error);
    } finally {
      setIsAddingWord(false);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleSpeak = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const paragraphs = passage.content.split(/\n\s*\n/).filter(p => p.trim());

  // Highlight collected words in passage text
  const renderHighlightedText = (text: string) => {
    if (collectedWords.length === 0) return text;

    // Sort by length (longest first) to prioritize longer phrases
    const sorted = [...collectedWords].sort((a, b) => b.word.length - a.word.length);
    const pattern = sorted.map(w => w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = sorted.some(w => w.word.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark key={i} className="bg-indigo-100 text-indigo-900 rounded px-0.5 py-0 font-medium">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-5 animate-fade-in">
      {/* Left: Passage */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div
          ref={passageRef}
          className="flex-1 bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-y-auto custom-scrollbar relative"
        >
          <div className="p-5 sm:p-8 lg:p-12">
            {/* Header */}
            <div className="mb-8 text-center border-b border-stone-200 pb-6">
              <div className="flex items-center justify-center gap-2 text-[#1e1b4b] text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                <BookOpen className="w-3 h-3" />
                {passage.type}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 leading-tight">
                {passage.title}
              </h1>
            </div>

            {/* Passage Content */}
            <article
              className="font-serif text-slate-700 text-lg leading-loose selection:bg-amber-100 selection:text-amber-900"
              onMouseUp={handleTextSelection}
            >
              {paragraphs.map((para, i) => (
                <p key={i} className="mb-5">{renderHighlightedText(para.trim())}</p>
              ))}
            </article>

            {/* Hint */}
            <div className="mt-8 pt-6 border-t border-stone-100 text-center">
              <p className="text-xs text-stone-400 italic">
                Highlight any word or phrase to explain it or add it to your vocabulary
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Selection Popover - rendered via portal to avoid parent transform issues */}
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
              <button
                onClick={handleAddToVocab}
                disabled={isAddingWord}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {isAddingWord ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Add
              </button>
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-stone-200 rotate-45" />
          </div>
        </div>,
        document.body
      )}

      {/* Explanation Popover - rendered via portal to avoid parent transform issues */}
      {explanation && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-9999"
          style={{ left: `${explanation.x}px`, top: `${explanation.y}px`, transform: 'translate(-50%, -100%)' }}
        >
          <div className="animate-scale-in">
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl max-w-[min(18rem,calc(100vw-2rem))] relative">
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

      {/* Right: Vocabulary Panel */}
      <div className="w-full lg:w-96 flex flex-col max-h-64 lg:max-h-none">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            My Vocabulary
          </h2>
          {collectedWords.length > 0 && (
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {collectedWords.length} words
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {collectedWords.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8 animate-fade-in">
                <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-stone-300" />
                </div>
                <p className="text-sm text-stone-400 font-medium mb-1">No words yet</p>
                <p className="text-xs text-stone-300 leading-relaxed max-w-48 mx-auto">
                  Highlight words in the passage and click &ldquo;Add&rdquo; to build your vocabulary
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {collectedWords.map((word, idx) => (
                <div
                  key={word.id}
                  className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm hover:shadow-md transition-all duration-200 animate-card-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 capitalize font-serif">{word.word}</h3>
                      <button
                        onClick={() => handleSpeak(word.word)}
                        className="text-stone-400 hover:text-indigo-600 transition-colors p-0.5"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => onRemoveWord(word.id)}
                      className="text-stone-300 hover:text-red-500 transition-colors p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed mb-2.5">{word.meaning}</p>

                  <div className="space-y-2">
                    <div className="bg-stone-50 rounded-lg p-2.5">
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Example</p>
                      <p className="text-xs text-slate-600 italic leading-relaxed">&ldquo;{word.exampleSentence}&rdquo;</p>
                    </div>
                    <div className="bg-amber-50/60 rounded-lg p-2.5">
                      <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">Memory Tip</p>
                      <p className="text-xs text-amber-800 leading-relaxed">{word.memoryTip}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isAddingWord && (
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-indigo-600 bg-indigo-50 rounded-lg py-2 animate-fade-in">
            <Loader2 className="w-3 h-3 animate-spin" />
            Adding word...
          </div>
        )}
      </div>
    </div>
  );
};
