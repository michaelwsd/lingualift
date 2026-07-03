'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CollectedWord, VocabMasteryState, VocabSkill } from '@/types';
import { StationType, STATION_META, stationPoints, streakMultiplier } from '@/lib/arena';
import { Flame, Brain, PencilLine, Keyboard, PenLine, Check } from 'lucide-react';
import { MeaningMatch } from '@/components/arena/stations/MeaningMatch';
import { DefineIt } from '@/components/arena/stations/DefineIt';
import { ListenAndSpell } from '@/components/arena/stations/ListenAndSpell';
import { UseIt } from '@/components/arena/stations/UseIt';
import { StationResult } from '@/components/arena/stationTypes';

// The four skills each word is taken through, in order.
const SKILLS: VocabSkill[] = ['meaning', 'define', 'spell', 'use_it'];

const SKILL_ICON: Record<VocabSkill, React.ReactNode> = {
  meaning: <Brain className="w-3.5 h-3.5" />,
  define: <PencilLine className="w-3.5 h-3.5" />,
  spell: <Keyboard className="w-3.5 h-3.5" />,
  use_it: <PenLine className="w-3.5 h-3.5" />,
};

interface VocabMasterySessionProps {
  words: CollectedWord[];
  savedState?: VocabMasteryState | null;
  onStateChange: (state: VocabMasteryState) => void;
  onComplete: () => void;
}

function buildOrder(words: CollectedWord[]): string[] {
  return words.flatMap(w => SKILLS.map(s => `${w.id}::${s}`));
}

export const VocabMasterySession: React.FC<VocabMasterySessionProps> = ({
  words,
  savedState,
  onStateChange,
  onComplete,
}) => {
  // Resolve the task order, migrating any saved order that references skills no
  // longer in SKILLS (e.g. the removed 'pronounce'): rebuild and resume at the
  // first still-uncleared task so existing progress is preserved.
  const { order, initialIndex } = useMemo(() => {
    const savedOrder = savedState?.order;
    const skillSet = new Set<string>(SKILLS);
    const valid = !!savedOrder && savedOrder.length > 0 && savedOrder.every(id => skillSet.has(id.split('::')[1]));
    if (valid) {
      return { order: savedOrder as string[], initialIndex: savedState?.currentIndex ?? 0 };
    }
    const fresh = buildOrder(words);
    const clearedSet = new Set(savedState?.clearedTaskIds ?? []);
    const idx = fresh.findIndex(id => !clearedSet.has(id));
    return { order: fresh, initialIndex: idx === -1 ? fresh.length : idx };
  }, [savedState, words]);

  const wordMap = useMemo(() => {
    const m = new Map<string, CollectedWord>();
    for (const w of words) m.set(w.id, w);
    return m;
  }, [words]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [cleared, setCleared] = useState<Set<string>>(() => new Set(savedState?.clearedTaskIds ?? []));
  const [points, setPoints] = useState(savedState?.points ?? 0);
  const [streak, setStreak] = useState(savedState?.streak ?? 0);
  const [bestStreak, setBestStreak] = useState(savedState?.bestStreak ?? 0);
  const [taskAttempts, setTaskAttempts] = useState<Record<string, number>>(savedState?.taskAttempts ?? {});
  const [perSkill, setPerSkill] = useState<Record<string, { firstTry: number; total: number }>>(savedState?.perSkill ?? {});
  const [masteredWordIds, setMasteredWordIds] = useState<Set<string>>(() => new Set(savedState?.masteredWordIds ?? []));
  const [gain, setGain] = useState<{ amount: number; id: number } | null>(null);

  const totalTasks = order.length;
  const currentTaskId = order[currentIndex];
  const [currentWordId, currentSkill] = currentTaskId ? (currentTaskId.split('::') as [string, VocabSkill]) : ['', 'meaning' as VocabSkill];
  const currentWord = wordMap.get(currentWordId);

  const persist = useCallback(
    (next: Partial<VocabMasteryState>) => {
      const snapshot: VocabMasteryState = {
        order,
        clearedTaskIds: Array.from(cleared),
        currentIndex,
        points,
        streak,
        bestStreak,
        taskAttempts,
        perSkill,
        masteredWordIds: Array.from(masteredWordIds),
        ...next,
      };
      onStateChange(snapshot);
    },
    [order, cleared, currentIndex, points, streak, bestStreak, taskAttempts, perSkill, masteredWordIds, onStateChange]
  );

  const handleComplete = useCallback(
    (result: StationResult) => {
      if (!currentTaskId) return;
      const [wordId, skill] = currentTaskId.split('::') as [string, VocabSkill];

      const gained = stationPoints(result.attempts, streak);
      const newPoints = points + gained;
      const newStreak = result.firstTry ? streak + 1 : 0;
      const newBest = Math.max(bestStreak, newStreak);
      const newAttempts = { ...taskAttempts, [currentTaskId]: result.attempts };
      const prevPs = perSkill[skill] ?? { firstTry: 0, total: 0 };
      const newPerSkill = {
        ...perSkill,
        [skill]: { firstTry: prevPs.firstTry + (result.firstTry ? 1 : 0), total: prevPs.total + 1 },
      };
      const newCleared = new Set(cleared).add(currentTaskId);

      // Word mastered = all four skills cleared, every one on the first try.
      let newMastered = masteredWordIds;
      const wordTasks = SKILLS.map(s => `${wordId}::${s}`);
      if (wordTasks.every(t => newCleared.has(t)) && wordTasks.every(t => (newAttempts[t] ?? 99) <= 1)) {
        newMastered = new Set(masteredWordIds).add(wordId);
      }

      const nextIndex = currentIndex + 1;

      setPoints(newPoints);
      setStreak(newStreak);
      setBestStreak(newBest);
      setTaskAttempts(newAttempts);
      setPerSkill(newPerSkill);
      setCleared(newCleared);
      setMasteredWordIds(newMastered);
      setCurrentIndex(nextIndex);
      setGain({ amount: gained, id: Date.now() });

      persist({
        clearedTaskIds: Array.from(newCleared),
        currentIndex: nextIndex,
        points: newPoints,
        streak: newStreak,
        bestStreak: newBest,
        taskAttempts: newAttempts,
        perSkill: newPerSkill,
        masteredWordIds: Array.from(newMastered),
      });

      if (nextIndex >= totalTasks) onComplete();
    },
    [currentTaskId, streak, points, bestStreak, taskAttempts, perSkill, cleared, masteredWordIds, currentIndex, totalTasks, persist, onComplete]
  );

  // Resumed at (or past) the end → finish rather than showing an empty loader.
  useEffect(() => {
    if (totalTasks > 0 && currentIndex >= totalTasks) onComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!currentWord || !currentTaskId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-stone-400">Loading exercises…</p>
      </div>
    );
  }

  const wordNumber = Math.floor(currentIndex / SKILLS.length) + 1;
  const totalWords = words.length;
  const stationKey = `${currentTaskId}-${currentIndex}`;
  const stationProps = { word: currentWord, allWords: words, onComplete: handleComplete };

  return (
    <div className="h-full flex flex-col">
      {/* Sub-header: current word context + skill dots + score/streak */}
      <div className="flex-none px-4 sm:px-6 py-3 bg-white/50 border-b border-stone-200/60">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Word {wordNumber} of {totalWords}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {SKILLS.map(skill => {
                const taskId = `${currentWordId}::${skill}`;
                const isCleared = cleared.has(taskId);
                const isCurrent = skill === currentSkill;
                return (
                  <span
                    key={skill}
                    title={STATION_META[skill as StationType].label}
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                      isCleared
                        ? 'bg-emerald-100 text-emerald-600'
                        : isCurrent
                        ? 'bg-[#1e1b4b] text-white'
                        : 'bg-stone-100 text-stone-300'
                    }`}
                  >
                    {isCleared ? <Check className="w-3.5 h-3.5" /> : SKILL_ICON[skill]}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 ${streak >= 2 ? 'text-orange-500' : 'text-stone-300'}`}>
              <Flame className={`w-4 h-4 ${streak >= 2 ? 'fill-orange-400/40' : ''}`} />
              <span className="text-sm font-bold tabular-nums">
                {streak > 0 ? `${streakMultiplier(streak).toFixed(2).replace(/\.00$/, '')}×` : '—'}
              </span>
            </div>
            <div className="relative text-right">
              <p className="text-lg font-bold text-[#1e1b4b] tabular-nums leading-none">{points.toLocaleString()}</p>
              {gain && (
                <span key={gain.id} className="absolute -top-4 right-0 text-xs font-bold text-emerald-500 animate-fade-in-up">
                  +{gain.amount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Station body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex items-start justify-center px-3 sm:px-5 py-6">
        {currentSkill === 'meaning' && <MeaningMatch key={stationKey} {...stationProps} />}
        {currentSkill === 'define' && <DefineIt key={stationKey} {...stationProps} />}
        {currentSkill === 'spell' && <ListenAndSpell key={stationKey} {...stationProps} />}
        {currentSkill === 'use_it' && <UseIt key={stationKey} {...stationProps} selfPaced />}
      </div>
    </div>
  );
};
