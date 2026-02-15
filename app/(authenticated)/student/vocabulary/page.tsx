'use client';

import { useState, useEffect } from 'react';
import { CollectedWord } from '@/types';
import { BookOpen, Volume2, Loader2, Search } from 'lucide-react';

export default function StudentVocabularyPage() {
  const [words, setWords] = useState<CollectedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/homework');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();

        // Aggregate all unique words across all homework
        const wordMap = new Map<string, CollectedWord>();
        for (const hw of data.assignments || []) {
          if (hw.collected_words) {
            for (const word of hw.collected_words) {
              if (!wordMap.has(word.word.toLowerCase())) {
                wordMap.set(word.word.toLowerCase(), word);
              }
            }
          }
        }
        setWords(Array.from(wordMap.values()));
      } catch {
        setWords([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  const filteredWords = search
    ? words.filter(w =>
        w.word.toLowerCase().includes(search.toLowerCase()) ||
        w.meaning.toLowerCase().includes(search.toLowerCase())
      )
    : words;

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
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-10">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">My Vocabulary</h1>
          <p className="text-sm text-stone-500">
            {words.length === 0
              ? 'Complete homework to build your vocabulary!'
              : `${words.length} word${words.length !== 1 ? 's' : ''} learned`}
          </p>
        </div>

        {words.length > 0 && (
          <div className="mb-6 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search words..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        )}

        {words.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-sm text-stone-400 font-medium mb-1">No vocabulary yet</p>
            <p className="text-xs text-stone-300">Words from your homework will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredWords.map((word, idx) => (
              <div
                key={word.id}
                className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm hover:shadow-md transition-all duration-200 animate-card-in"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-bold text-slate-900 capitalize font-serif">{word.word}</h3>
                  <button
                    onClick={() => handleSpeak(word.word)}
                    className="text-stone-400 hover:text-indigo-600 transition-colors p-0.5"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
