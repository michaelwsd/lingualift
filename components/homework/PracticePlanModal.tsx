'use client';

import React, { useState } from 'react';
import { createPracticePlan } from '@/services/api';
import { CalendarRange, Check, Loader2, Minus, Plus, Sparkles, X } from 'lucide-react';

interface PracticePlanModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onCreated: () => void;
}

function Stepper({ label, value, setValue, min, max }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number }) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="flex-1">
      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setValue(clamp(value - 1))}
          disabled={value <= min}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-40"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={e => setValue(clamp(parseInt(e.target.value) || min))}
          className="w-16 text-center text-lg font-bold text-slate-800 py-1.5 rounded-lg border-2 border-stone-200 outline-none focus:border-[#1e1b4b]"
        />
        <button
          type="button"
          onClick={() => setValue(clamp(value + 1))}
          disabled={value >= max}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export const PracticePlanModal: React.FC<PracticePlanModalProps> = ({ studentId, studentName, onClose, onCreated }) => {
  const [wordsPerDay, setWordsPerDay] = useState(5);
  const [days, setDays] = useState(5);
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = studentName?.split(' ')[0] || 'the student';

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      await createPracticePlan({ studentId, studentName, wordsPerDay, days });
      setDone(true);
      onCreated();
      setTimeout(onClose, 1300);
    } catch {
      setError('Failed to create the plan. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={creating ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200/60 w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <CalendarRange className="w-5 h-5 text-indigo-500" />
            Create Practice Plan
          </h2>
          {!creating && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100 transition-colors">
              <X className="w-4 h-4 text-stone-500" />
            </button>
          )}
        </div>

        {done ? (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Plan created — {days} daily exercises added!</p>
            <p className="text-xs text-stone-400 mt-1">One unlocks each day for {firstName}.</p>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-5">
            <p className="text-sm text-stone-500">
              Randomly pick words from {firstName}&apos;s vocabulary for daily practice. Each day is a quick 4-skill
              gauntlet (understand, define, spell, use).
            </p>

            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>
            )}

            <div className="flex items-center gap-4">
              <Stepper label="Words / day" value={wordsPerDay} setValue={setWordsPerDay} min={1} max={30} />
              <Stepper label="Days" value={days} setValue={setDays} min={1} max={30} />
            </div>

            <div className="flex items-start gap-2 px-3.5 py-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <Sparkles className="w-4 h-4 text-indigo-500 flex-none mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                {firstName} will practise <span className="font-semibold text-slate-800">{wordsPerDay} words a day for {days} {days === 1 ? 'day' : 'days'}</span>.
                One exercise unlocks each day — day 1 is available now.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-stone-500 hover:text-stone-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <>Create plan</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
