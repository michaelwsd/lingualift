'use client';

import React from 'react';
import { Brain, PencilLine, Keyboard, Shuffle, PenLine } from 'lucide-react';
import { StationType, STATION_META } from '@/lib/arena';

const STATION_ICON: Record<StationType, React.ReactNode> = {
  meaning: <Brain className="w-4 h-4" />,
  define: <PencilLine className="w-4 h-4" />,
  spell: <Keyboard className="w-4 h-4" />,
  unscramble: <Shuffle className="w-4 h-4" />,
  use_it: <PenLine className="w-4 h-4" />,
};

const STATION_ACCENT: Record<StationType, string> = {
  meaning: 'bg-violet-100 text-violet-700',
  define: 'bg-sky-100 text-sky-700',
  spell: 'bg-amber-100 text-amber-700',
  unscramble: 'bg-emerald-100 text-emerald-700',
  use_it: 'bg-rose-100 text-rose-700',
};

interface StationCardProps {
  type: StationType;
  children: React.ReactNode;
}

export const StationCard: React.FC<StationCardProps> = ({ type, children }) => {
  const meta = STATION_META[type];
  return (
    <div className="w-full max-w-xl mx-auto animate-scale-in">
      <div className="bg-white rounded-2xl shadow-xl shadow-black/20 border border-white/10 p-5 sm:p-7">
        <div className="flex items-center gap-2.5 mb-5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${STATION_ACCENT[type]}`}>
            {STATION_ICON[type]}
            {meta.label}
          </span>
          <span className="text-xs text-stone-400 font-medium">{meta.tagline}</span>
        </div>
        {children}
      </div>
    </div>
  );
};
