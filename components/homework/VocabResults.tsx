'use client';

import React from 'react';
import Link from 'next/link';
import { CollectedWord, VocabMasteryState, VocabSkill } from '@/types';
import { STATION_META } from '@/lib/arena';
import { Trophy, Target, Flame, Star, ArrowLeft, Sparkles } from 'lucide-react';

const SKILLS: VocabSkill[] = ['meaning', 'define', 'spell', 'use_it'];

interface VocabResultsProps {
  state: VocabMasteryState | null;
  words: CollectedWord[];
}

export const VocabResults: React.FC<VocabResultsProps> = ({ state, words }) => {
  const totalWords = words.length;

  const totalTasks = state?.order.length ?? 0;
  const firstTryTasks = state ? Object.values(state.perSkill).reduce((s, x) => s + x.firstTry, 0) : 0;
  const gradedTasks = state ? Object.values(state.perSkill).reduce((s, x) => s + x.total, 0) : 0;
  const accuracy = gradedTasks > 0 ? Math.round((firstTryTasks / gradedTasks) * 100) : 0;
  const mastered = state?.masteredWordIds.length ?? 0;
  const points = state?.points ?? 0;
  const bestStreak = state?.bestStreak ?? 0;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar flex items-center justify-center px-3 sm:px-5 lg:px-8 py-8">
      <div className="w-full max-w-lg animate-scale-in">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
            <Trophy className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">Vocabulary complete!</h2>
          <p className="text-sm text-stone-500 mt-1">
            You practised understanding, speaking, spelling and using {totalWords} word{totalWords !== 1 ? 's' : ''}.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-5 sm:p-6">
          <div className="text-center mb-5">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Points earned</p>
            <p className="text-4xl font-serif font-bold text-[#1e1b4b] mt-1">{points.toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <Stat icon={<Sparkles className="w-4 h-4" />} label="Mastered" value={`${mastered}/${totalWords}`} accent="text-violet-600 bg-violet-50" />
            <Stat icon={<Target className="w-4 h-4" />} label="First try" value={`${accuracy}%`} accent="text-emerald-600 bg-emerald-50" />
            <Stat icon={<Flame className="w-4 h-4" />} label="Best streak" value={`${bestStreak}`} accent="text-orange-600 bg-orange-50" />
          </div>

          {gradedTasks > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">How you did by skill</p>
              <div className="space-y-2">
                {SKILLS.map(skill => {
                  const ps = state?.perSkill[skill];
                  if (!ps || ps.total === 0) return null;
                  const pct = Math.round((ps.firstTry / ps.total) * 100);
                  return (
                    <div key={skill} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-600 w-24 flex-none">{STATION_META[skill].targets}</span>
                      <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-stone-400 w-12 text-right flex-none">{ps.firstTry}/{ps.total}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mastered === totalWords && totalWords > 0 && (
            <div className="flex items-center gap-2 justify-center mb-5 text-sm font-semibold text-emerald-600">
              <Star className="w-4 h-4 fill-emerald-400 text-emerald-400" /> Perfect run — every word mastered first try!
            </div>
          )}

          <Link
            href="/student/homework"
            className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Homework
          </Link>
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
