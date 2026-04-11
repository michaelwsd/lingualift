'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { CollectedWord } from '@/types';
import { speak } from '@/lib/speak';
import {
  BookOpen,
  Volume2,
  Loader2,
  Search,
  Layers,
  List,
  X,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';

interface VocabWord extends CollectedWord {
  lessonTitle: string;
  homeworkId: string;
}

interface Lesson {
  homeworkId: string;
  lessonTitle: string;
  assignedAt: string;
  words: CollectedWord[];
}

type ViewMode = 'all' | 'by-lesson';

const REMOVED_KEY = 'lingualift-removed-vocab';

function getRemovedSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(REMOVED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveRemovedSet(set: Set<string>) {
  localStorage.setItem(REMOVED_KEY, JSON.stringify(Array.from(set)));
}

function fuzzyMatch(target: string, query: string): boolean {
  return target.toLowerCase().includes(query.toLowerCase());
}

// --- Word Detail Modal ---

function WordModal({
  word,
  onClose,
}: {
  word: VocabWord;
  onClose: () => void;
}) {
  const handleSpeak = (text: string) => speak(text);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-stone-200/60 w-full max-w-md animate-bounce-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-br from-[#1e1b4b] to-indigo-800 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-serif font-bold text-white capitalize">
                  {word.word}
                </h2>
                {word.phonetic && (
                  <span className="text-sm text-indigo-200 font-normal">{word.phonetic}</span>
                )}
              </div>
              <p className="text-indigo-200 text-xs mt-1 font-medium">
                from: {word.lessonTitle}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSpeak(word.word)}
                className="text-indigo-200 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="text-indigo-200 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
              Definition
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {word.meaning}
            </p>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
              Example
            </p>
            <p className="text-sm text-slate-600 italic leading-relaxed">
              &ldquo;{word.exampleSentence}&rdquo;
            </p>
          </div>

          {word.memoryTip && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Memory Tip
                </p>
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">
                {word.memoryTip}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-stone-500 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Word Card Component ---

function WordCard({
  word,
  onRemove,
  onClick,
  delay,
}: {
  word: VocabWord;
  onRemove: (key: string) => void;
  onClick: () => void;
  delay: number;
}) {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(word.word.toLowerCase());
  };

  return (
    <div
      className="animate-card-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        onClick={onClick}
        className="w-full text-left bg-white rounded-xl border border-stone-200/80 shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-200 p-5 group cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 capitalize font-serif">
              {word.word}
            </h3>
            {word.phonetic && (
              <p className="text-[11px] text-stone-400 mt-0.5">{word.phonetic}</p>
            )}
          </div>
          <button
            onClick={handleRemove}
            className="text-stone-300 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 flex-none"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
          {word.meaning}
        </p>
        <div className="mt-3 pt-2.5 border-t border-stone-100">
          <p className="text-[10px] font-semibold text-stone-300 uppercase tracking-wider truncate">
            from: {word.lessonTitle}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Collapsible Lesson Group ---

function LessonGroup({
  title,
  date,
  words,
  removedKeys,
  onRemove,
  onWordClick,
  startDelay,
}: {
  title: string;
  date: string;
  words: VocabWord[];
  removedKeys: Set<string>;
  onRemove: (key: string) => void;
  onWordClick: (word: VocabWord) => void;
  startDelay: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const visibleWords = words.filter(w => !removedKeys.has(w.word.toLowerCase()));

  if (visibleWords.length === 0) return null;

  const formattedDate = new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${startDelay}ms` }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 mb-3 group"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-stone-400 flex-none" />
          ) : (
            <ChevronRight className="w-4 h-4 text-stone-400 flex-none" />
          )}
          <h2 className="text-sm font-bold text-slate-800 font-serif truncate">
            {title}
          </h2>
          <span className="text-[10px] text-stone-400 font-medium flex-none">
            {formattedDate}
          </span>
        </div>
        <span className="text-[10px] font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full flex-none">
          {visibleWords.length} word{visibleWords.length !== 1 ? 's' : ''}
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {visibleWords.map((word, idx) => (
            <WordCard
              key={word.id}
              word={word}
              onRemove={onRemove}
              onClick={() => onWordClick(word)}
              delay={startDelay + idx * 40}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main Page ---

export default function StudentVocabularyPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null);

  useEffect(() => {
    setRemovedKeys(getRemovedSet());
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/vocabulary');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setLessons(data.lessons || []);
      } catch {
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Build deduplicated flat word list
  const allWords = useMemo(() => {
    const seen = new Set<string>();
    const result: VocabWord[] = [];
    for (const lesson of lessons) {
      for (const word of lesson.words) {
        const key = word.word.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push({
            ...word,
            lessonTitle: lesson.lessonTitle,
            homeworkId: lesson.homeworkId,
          });
        }
      }
    }
    return result;
  }, [lessons]);

  // Visible words (after removing)
  const visibleWords = useMemo(
    () => allWords.filter(w => !removedKeys.has(w.word.toLowerCase())),
    [allWords, removedKeys]
  );

  // Filtered words (after search)
  const filteredWords = useMemo(() => {
    if (!search.trim()) return visibleWords;
    return visibleWords.filter(
      w => fuzzyMatch(w.word, search) || fuzzyMatch(w.meaning, search)
    );
  }, [visibleWords, search]);

  // Lesson words with VocabWord enrichment
  const enrichedLessons = useMemo(() => {
    return lessons.map(lesson => ({
      ...lesson,
      enrichedWords: lesson.words.map(w => ({
        ...w,
        lessonTitle: lesson.lessonTitle,
        homeworkId: lesson.homeworkId,
      })) as VocabWord[],
    }));
  }, [lessons]);

  // Filtered lessons
  const filteredLessons = useMemo(() => {
    if (!search.trim()) return enrichedLessons;
    return enrichedLessons
      .map(lesson => ({
        ...lesson,
        enrichedWords: lesson.enrichedWords.filter(
          w =>
            !removedKeys.has(w.word.toLowerCase()) &&
            (fuzzyMatch(w.word, search) || fuzzyMatch(w.meaning, search))
        ),
      }))
      .filter(lesson => lesson.enrichedWords.length > 0);
  }, [enrichedLessons, search, removedKeys]);

  const handleRemove = useCallback((wordKey: string) => {
    setRemovedKeys(prev => {
      const next = new Set(prev);
      next.add(wordKey);
      saveRemovedSet(next);
      return next;
    });
  }, []);

  const handleRestoreAll = useCallback(() => {
    setRemovedKeys(new Set());
    saveRemovedSet(new Set());
  }, []);

  const removedCount = useMemo(
    () => allWords.filter(w => removedKeys.has(w.word.toLowerCase())).length,
    [allWords, removedKeys]
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-400">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">
            My Vocabulary
          </h1>
          <p className="text-sm text-stone-500">
            {visibleWords.length === 0
              ? 'Complete homework to build your vocabulary!'
              : `${visibleWords.length} word${visibleWords.length !== 1 ? 's' : ''} learned`}
          </p>
        </div>

        {allWords.length > 0 && (
          <>
            {/* Search + View Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search words or definitions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex bg-stone-100 rounded-xl p-1 gap-0.5 flex-none">
                <button
                  onClick={() => setViewMode('all')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    viewMode === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  All
                </button>
                <button
                  onClick={() => setViewMode('by-lesson')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    viewMode === 'by-lesson'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  By Lesson
                </button>
              </div>
            </div>

            {/* Removed words banner */}
            {removedCount > 0 && (
              <div className="mb-4 flex items-center justify-between bg-stone-50 border border-stone-200/80 rounded-xl px-4 py-2.5 animate-fade-in">
                <span className="text-xs text-stone-500">
                  {removedCount} word{removedCount !== 1 ? 's' : ''} removed
                </span>
                <button
                  onClick={handleRestoreAll}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore all
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {allWords.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-sm text-stone-400 font-medium mb-1">No vocabulary yet</p>
            <p className="text-xs text-stone-300">Words from your homework will appear here</p>
          </div>
        ) : filteredWords.length === 0 && viewMode === 'all' ? (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-sm text-stone-400 font-medium">No words match your search</p>
          </div>
        ) : viewMode === 'all' ? (
          /* All Words View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredWords.map((word, idx) => (
              <WordCard
                key={word.word.toLowerCase()}
                word={word}
                onRemove={handleRemove}
                onClick={() => setSelectedWord(word)}
                delay={idx * 30}
              />
            ))}
          </div>
        ) : (
          /* By Lesson View */
          <div className="space-y-2">
            {filteredLessons.map((lesson, idx) => (
              <LessonGroup
                key={lesson.homeworkId}
                title={lesson.lessonTitle}
                date={lesson.assignedAt}
                words={lesson.enrichedWords}
                removedKeys={removedKeys}
                onRemove={handleRemove}
                onWordClick={setSelectedWord}
                startDelay={idx * 80}
              />
            ))}
            {filteredLessons.length === 0 && (
              <div className="text-center py-12 animate-fade-in">
                <p className="text-sm text-stone-400 font-medium">No lessons match your search</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Word Detail Modal */}
      {selectedWord && (
        <WordModal word={selectedWord} onClose={() => setSelectedWord(null)} />
      )}
    </div>
  );
}
