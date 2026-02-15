'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LITERATURE_TYPES } from '@/constants';
import { GenerationConfig, LiteratureType } from '@/types';
import { Button } from '@/components/Button';
import { Sparkles, GraduationCap, Search, RefreshCw } from 'lucide-react';
import { suggestTopics } from '@/services/api';

interface GeneratorFormProps {
  onGenerate: (config: GenerationConfig) => void;
  isGenerating: boolean;
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ onGenerate, isGenerating }) => {
  const [userInput, setUserInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [literatureType, setLiteratureType] = useState<LiteratureType>(LiteratureType.NEWS_ARTICLE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const DAILY_TOPICS_KEY = 'lingualift-daily-topics';

  const fetchSuggestions = useCallback(async (input?: string, format?: string) => {
    setIsLoadingSuggestions(true);
    try {
      const topics = await suggestTopics(input || undefined, format || undefined);
      setSuggestions(topics);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Load daily cached topics or fetch new ones
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const cached = JSON.parse(localStorage.getItem(DAILY_TOPICS_KEY) || '{}');
      if (cached.date === today && Array.isArray(cached.topics) && cached.topics.length > 0) {
        setSuggestions(cached.topics);
        setIsLoadingSuggestions(false);
        return;
      }
    } catch {}
    // No valid cache — fetch and store
    (async () => {
      setIsLoadingSuggestions(true);
      try {
        const topics = await suggestTopics();
        setSuggestions(topics);
        localStorage.setItem(DAILY_TOPICS_KEY, JSON.stringify({ date: today, topics }));
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    })();
  }, []);

  const handleRefresh = async () => {
    setSelectedTopic(null);
    setIsLoadingSuggestions(true);
    try {
      const topics = await suggestTopics(userInput || undefined, literatureType || undefined);
      setSuggestions(topics);
      // Only update daily cache if it's a generic refresh (no user input)
      if (!userInput) {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem(DAILY_TOPICS_KEY, JSON.stringify({ date: today, topics }));
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(selectedTopic === topic ? null : topic);
    if (selectedTopic !== topic) setUserInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
    setSelectedTopic(null);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (userInput.trim()) fetchSuggestions(userInput.trim(), literatureType || undefined);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const topic = selectedTopic || userInput.trim();
    if (!topic) return;
    onGenerate({ topic, literatureType });
  };

  const hasTopic = !!(selectedTopic || userInput.trim());

  return (
    <div className={`max-w-2xl mx-auto w-full transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="bg-white rounded-2xl shadow-2xl shadow-indigo-900/5 border border-stone-200/60 overflow-hidden">

        {/* Header */}
        <div className="bg-linear-to-br from-[#1e1b4b] to-[#312e81] px-8 py-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
              <GraduationCap className="w-7 h-7 text-indigo-200" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-1">EAL Resource Generator</h2>
            <p className="text-indigo-300/80 font-light text-sm">Create tailored reading passages</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-7 bg-[#fdfbf7]">

          {/* Topic */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-900 text-white text-[10px] font-bold">1</span>
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Topic</h3>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className={`h-4 w-4 transition-colors ${userInput ? 'text-indigo-600' : 'text-stone-400'}`} />
              </div>
              <input
                type="text"
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder="Type a topic and press Enter..."
                className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl outline-none text-sm text-slate-800 placeholder:text-stone-400 transition-all duration-200 ${
                  userInput ? 'border-indigo-500 ring-1 ring-indigo-500/30 shadow-sm' : 'border-stone-300 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30'
                }`}
              />
            </div>

            {/* Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Suggestions</span>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isLoadingSuggestions}
                  className="flex items-center gap-1 text-[10px] font-semibold text-indigo-500 hover:text-indigo-700 transition-colors disabled:opacity-40"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-9">
                {isLoadingSuggestions ? (
                  [100, 140, 120, 160, 110].map((w, i) => (
                    <div key={i} className="h-8 rounded-lg bg-stone-100 animate-pulse" style={{ width: `${w}px` }} />
                  ))
                ) : suggestions.map((topic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTopicSelect(topic)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      selectedTopic === topic
                        ? 'bg-indigo-900 text-white shadow-lg shadow-indigo-900/20 scale-[1.02]'
                        : 'bg-white text-stone-600 border border-stone-200 hover:border-indigo-300 hover:text-indigo-900 hover:shadow-sm'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Format */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-900 text-white text-[10px] font-bold">2</span>
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Format</h3>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {LITERATURE_TYPES.map((type) => (
                <label
                  key={type}
                  className={`cursor-pointer text-center px-2 py-2.5 rounded-lg border transition-all duration-200 text-xs font-medium select-none ${
                    literatureType === type
                      ? 'bg-indigo-900 text-white border-indigo-900 shadow-lg shadow-indigo-900/20'
                      : 'bg-white text-stone-500 border-stone-200 hover:border-indigo-300 hover:text-indigo-800'
                  }`}
                >
                  <input type="radio" name="literatureType" value={type} checked={literatureType === type} onChange={() => setLiteratureType(type as LiteratureType)} className="sr-only" />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Generate */}
          <Button
            type="submit"
            className="w-full py-3.5 text-base bg-linear-to-r from-indigo-900 to-indigo-800 hover:from-indigo-800 hover:to-indigo-700 text-white font-serif tracking-wide shadow-xl shadow-indigo-900/15 hover:shadow-2xl hover:shadow-indigo-900/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
            isLoading={isGenerating}
            disabled={!hasTopic || isGenerating}
          >
            {!isGenerating && <Sparkles className="w-4 h-4 mr-2 text-indigo-300" />}
            {isGenerating ? 'Generating...' : 'Generate Passage'}
          </Button>
        </form>
      </div>
    </div>
  );
};
