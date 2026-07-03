'use client';

import React from 'react';
import { Trophy, Target, Flame, Star, RotateCcw, LogOut, AlertCircle } from 'lucide-react';
import { StationType, STATION_META } from '@/lib/arena';

export interface ArenaStats {
  score: number;
  wordsMastered: number;
  totalWords: number;
  totalStations: number;
  firstTryStations: number;
  bestStreak: number;
  perStation: { type: StationType; firstTry: number; total: number }[];
  toughWords: { word: string; attempts: number }[];
}

interface ArenaCompleteProps {
  stats: ArenaStats;
  studentName: string;
  onReplay: () => void;
  onExit: () => void;
}

export const ArenaComplete: React.FC<ArenaCompleteProps> = ({ stats, studentName, onReplay, onExit }) => {
  const accuracy = stats.totalStations > 0 ? Math.round((stats.firstTryStations / stats.totalStations) * 100) : 0;

  return (
    <div className="w-full max-w-lg mx-auto animate-scale-in">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-900/40 mb-4 animate-bounce-in">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-white">Challenge complete!</h1>
        <p className="text-sm text-indigo-200/80 mt-1.5">
          {studentName} mastered <span className="font-semibold text-white">{stats.wordsMastered}</span> of {stats.totalWords} words
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-black/30 p-5 sm:p-6">
        {/* Score */}
        <div className="text-center mb-5">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total score</p>
          <p className="text-5xl font-serif font-bold text-[#1e1b4b] mt-1">{stats.score.toLocaleString()}</p>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat icon={<Target className="w-4 h-4" />} label="Accuracy" value={`${accuracy}%`} accent="text-emerald-600 bg-emerald-50" />
          <Stat icon={<Flame className="w-4 h-4" />} label="Best streak" value={`${stats.bestStreak}`} accent="text-orange-600 bg-orange-50" />
          <Stat icon={<Star className="w-4 h-4" />} label="Words" value={`${stats.wordsMastered}/${stats.totalWords}`} accent="text-violet-600 bg-violet-50" />
        </div>

        {/* Per-station breakdown */}
        {stats.perStation.length > 0 && (
          <div className="mb-5">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">First-try by station</p>
            <div className="space-y-2">
              {stats.perStation.map(s => {
                const pct = s.total > 0 ? Math.round((s.firstTry / s.total) * 100) : 0;
                return (
                  <div key={s.type} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-600 w-28 flex-none">{STATION_META[s.type].label}</span>
                    <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-stone-400 w-14 text-right flex-none">{s.firstTry}/{s.total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Words that needed work — useful for the teacher */}
        {stats.toughWords.length > 0 && (
          <div className="mb-5 rounded-xl bg-amber-50/60 border border-amber-200 p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2">
              <AlertCircle className="w-3.5 h-3.5" /> Needs more practice
            </p>
            <div className="flex flex-wrap gap-1.5">
              {stats.toughWords.map(w => (
                <span key={w.word} className="px-2.5 py-1 rounded-md bg-white border border-amber-200 text-xs font-medium text-slate-700 capitalize">
                  {w.word}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={onReplay}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#1e1b4b] bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
          >
            <RotateCcw className="w-4 h-4" /> New round
          </button>
          <button
            onClick={onExit}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <LogOut className="w-4 h-4" /> Done
          </button>
        </div>
      </div>
    </div>
  );
};

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl bg-stone-50 border border-stone-200/70 p-3 text-center">
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-1.5 ${accent}`}>{icon}</span>
      <p className="text-lg font-bold text-slate-800 leading-none">{value}</p>
      <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}
