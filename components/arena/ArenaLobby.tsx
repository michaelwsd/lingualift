'use client';

import React, { useState } from 'react';
import { Swords, Brain, PencilLine, Keyboard, Shuffle, PenLine, Play, X, Check } from 'lucide-react';
import { StationType, STATION_META, ArenaConfig, DEFAULT_STATIONS } from '@/lib/arena';

const STATION_ICON: Record<StationType, React.ReactNode> = {
  meaning: <Brain className="w-4 h-4" />,
  define: <PencilLine className="w-4 h-4" />,
  spell: <Keyboard className="w-4 h-4" />,
  unscramble: <Shuffle className="w-4 h-4" />,
  use_it: <PenLine className="w-4 h-4" />,
};

interface ArenaLobbyProps {
  studentName: string;
  totalWords: number;
  onStart: (config: ArenaConfig) => void;
  onExit: () => void;
}

export const ArenaLobby: React.FC<ArenaLobbyProps> = ({ studentName, totalWords, onStart, onExit }) => {
  const [stations, setStations] = useState<StationType[]>(DEFAULT_STATIONS);
  const [wordCount, setWordCount] = useState<number>(Math.min(totalWords, 10));

  const toggleStation = (type: StationType) => {
    setStations(prev =>
      prev.includes(type) ? prev.filter(s => s !== type) : DEFAULT_STATIONS.filter(s => prev.includes(s) || s === type)
    );
  };

  const countOptions = [5, 10, 15, totalWords].filter((n, i, arr) => n <= totalWords && arr.indexOf(n) === i);

  const canStart = stations.length > 0 && wordCount > 0;

  return (
    <div className="w-full max-w-lg mx-auto animate-scale-in">
      <div className="text-center mb-7">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-lg shadow-indigo-900/40 mb-4">
          <Swords className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-white">Word Arena</h1>
        <p className="text-sm text-indigo-200/80 mt-1.5">
          A live mastery challenge for <span className="font-semibold text-white">{studentName}</span> · {totalWords} words available
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-black/30 p-5 sm:p-6">
        {/* Stations */}
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-3">Challenge stations</p>
        <div className="space-y-2 mb-6">
          {DEFAULT_STATIONS.map(type => {
            const meta = STATION_META[type];
            const active = stations.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggleStation(type)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 text-left transition-all ${
                  active ? 'border-[#1e1b4b] bg-indigo-50/60' : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <span
                  className={`flex-none flex items-center justify-center w-8 h-8 rounded-lg ${
                    active ? 'bg-[#1e1b4b] text-white' : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {STATION_ICON[type]}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-800">{meta.label}</span>
                  <span className="block text-xs text-stone-400">{meta.tagline} · {meta.targets}</span>
                </span>
                <span
                  className={`flex-none flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                    active ? 'border-[#1e1b4b] bg-[#1e1b4b] text-white' : 'border-stone-300 text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3" />
                </span>
              </button>
            );
          })}
        </div>

        {/* Word count */}
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-3">How many words</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {countOptions.map(n => (
            <button
              key={n}
              onClick={() => setWordCount(n)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                wordCount === n ? 'border-[#1e1b4b] bg-[#1e1b4b] text-white' : 'border-stone-200 text-slate-600 hover:border-stone-300'
              }`}
            >
              {n === totalWords ? `All ${n}` : n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-stone-500 hover:text-stone-700 transition-colors"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={() => canStart && onStart({ stations, wordCount })}
            disabled={!canStart}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-white" /> Start challenge
          </button>
        </div>
      </div>
    </div>
  );
};
