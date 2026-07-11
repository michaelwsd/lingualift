'use client';

import React, { useCallback, useRef, useState } from 'react';
import { CollectedWord } from '@/types';
import {
  StationType,
  ArenaConfig,
  pickWords,
  stationPoints,
  streakMultiplier,
  isSpellingStation,
} from '@/lib/arena';
import { X, Flame, SkipForward } from 'lucide-react';
import { ArenaLobby } from './ArenaLobby';
import { ArenaComplete, ArenaStats } from './ArenaComplete';
import { StationResult } from './stationTypes';
import { MeaningMatch } from './stations/MeaningMatch';
import { DefineIt } from './stations/DefineIt';
import { ListenAndSpell } from './stations/ListenAndSpell';
import { Unscramble } from './stations/Unscramble';
import { UseIt } from './stations/UseIt';

type Mode = 'lobby' | 'playing' | 'complete';

interface WordArenaProps {
  studentName: string;
  words: CollectedWord[];
  onExit: () => void;
}

export const WordArena: React.FC<WordArenaProps> = ({ studentName, words, onExit }) => {
  const [mode, setMode] = useState<Mode>('lobby');
  const [config, setConfig] = useState<ArenaConfig | null>(null);
  const [sessionWords, setSessionWords] = useState<CollectedWord[]>([]);

  // Display state
  const [wordIndex, setWordIndex] = useState(0);
  const [stationIndex, setStationIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gain, setGain] = useState<{ amount: number; id: number } | null>(null);
  const [finalStats, setFinalStats] = useState<ArenaStats | null>(null);

  // Accumulators (refs — read at finish without stale-state issues)
  const scoreRef = useRef(0);
  const bestStreakRef = useRef(0);
  const wordsMasteredRef = useRef(0);
  const perStationRef = useRef<Map<StationType, { firstTry: number; total: number }>>(new Map());
  const wordAttemptsRef = useRef<Map<string, number>>(new Map());
  const wordCleanRef = useRef(true);

  const resetAccumulators = () => {
    scoreRef.current = 0;
    bestStreakRef.current = 0;
    wordsMasteredRef.current = 0;
    perStationRef.current = new Map();
    wordAttemptsRef.current = new Map();
    wordCleanRef.current = true;
  };

  const startSession = useCallback((cfg: ArenaConfig) => {
    resetAccumulators();
    setConfig(cfg);
    setSessionWords(pickWords(words, cfg.wordCount));
    setWordIndex(0);
    setStationIndex(0);
    setScore(0);
    setStreak(0);
    setGain(null);
    setMode('playing');
  }, [words]);

  const finish = useCallback((cfg: ArenaConfig, wordList: CollectedWord[]) => {
    const perStation = cfg.stations.map(type => ({
      type,
      firstTry: perStationRef.current.get(type)?.firstTry ?? 0,
      total: perStationRef.current.get(type)?.total ?? 0,
    }));
    const totalStations = perStation.reduce((s, x) => s + x.total, 0);
    const firstTryStations = perStation.reduce((s, x) => s + x.firstTry, 0);

    const toughWords = wordList
      .map(w => ({ word: w.word, attempts: wordAttemptsRef.current.get(w.id) ?? 0 }))
      .map(w => ({ ...w, extra: w.attempts - cfg.stations.length }))
      .filter(w => w.extra > 0)
      .sort((a, b) => b.extra - a.extra)
      .slice(0, 6)
      .map(({ word, attempts }) => ({ word, attempts }));

    setFinalStats({
      score: scoreRef.current,
      wordsMastered: wordsMasteredRef.current,
      totalWords: wordList.length,
      totalStations,
      firstTryStations,
      bestStreak: bestStreakRef.current,
      perStation,
      toughWords,
    });
    setMode('complete');
  }, []);

  const handleStationComplete = useCallback(
    (result: StationResult) => {
      if (!config) return;
      const stationType = config.stations[stationIndex];
      const currentWord = sessionWords[wordIndex];

      // Score using the streak level in effect when the station was cleared.
      const gained = stationPoints(result.attempts, streak);
      scoreRef.current += gained;
      setScore(scoreRef.current);
      setGain({ amount: gained, id: Date.now() });

      const newStreak = result.firstTry ? streak + 1 : 0;
      setStreak(newStreak);
      if (newStreak > bestStreakRef.current) bestStreakRef.current = newStreak;

      // Per-station tally
      const st = perStationRef.current.get(stationType) ?? { firstTry: 0, total: 0 };
      st.total += 1;
      if (result.firstTry) st.firstTry += 1;
      perStationRef.current.set(stationType, st);

      // Per-word attempts + clean-sweep tracking
      wordAttemptsRef.current.set(currentWord.id, (wordAttemptsRef.current.get(currentWord.id) ?? 0) + result.attempts);
      if (!result.firstTry) wordCleanRef.current = false;

      // Advance
      const nextStation = stationIndex + 1;
      if (nextStation < config.stations.length) {
        setStationIndex(nextStation);
        return;
      }

      // Word finished
      if (wordCleanRef.current) wordsMasteredRef.current += 1;
      wordCleanRef.current = true;

      const nextWord = wordIndex + 1;
      if (nextWord < sessionWords.length) {
        setWordIndex(nextWord);
        setStationIndex(0);
      } else {
        finish(config, sessionWords);
      }
    },
    [config, stationIndex, wordIndex, sessionWords, streak, finish]
  );

  // Teacher skip — advance current station without awarding first-try.
  const skipStation = () => handleStationComplete({ attempts: 3, firstTry: false });

  const renderStation = () => {
    if (!config) return null;
    const stationType = config.stations[stationIndex];
    const word = sessionWords[wordIndex];
    const key = `${word.id}-${stationIndex}`;
    const props = { word, allWords: sessionWords, onComplete: handleStationComplete };

    switch (stationType) {
      case 'meaning':
        return <MeaningMatch key={key} {...props} />;
      case 'define':
        return <DefineIt key={key} {...props} />;
      case 'spell':
        return <ListenAndSpell key={key} {...props} />;
      case 'unscramble':
        return <Unscramble key={key} {...props} />;
      case 'use_it':
        return <UseIt key={key} {...props} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#1e1b4b] via-[#221f52] to-indigo-950">
      {/* subtle vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(129,140,248,0.15),_transparent_60%)]" />

      {mode === 'lobby' && (
        <div className="relative min-h-full flex items-center justify-center p-4 sm:p-6">
          <ArenaLobby studentName={studentName} totalWords={words.length} onStart={startSession} onExit={onExit} />
        </div>
      )}

      {mode === 'complete' && finalStats && (
        <div className="relative min-h-full flex items-center justify-center p-4 sm:p-6">
          <ArenaComplete
            stats={finalStats}
            studentName={studentName}
            onReplay={() => setMode('lobby')}
            onExit={onExit}
          />
        </div>
      )}

      {mode === 'playing' && config && (
        <div className="relative min-h-full flex flex-col">
          {/* HUD */}
          <div className="flex-none px-4 sm:px-6 py-4">
            <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
              <button
                onClick={onExit}
                className="flex-none flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                title="Exit challenge"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center">
                <p className="text-[11px] font-semibold text-indigo-200/70 uppercase tracking-wider">
                  Word {wordIndex + 1} / {sessionWords.length}
                </p>
                {/* Hide the word entirely during spelling stations so it isn't given away. */}
                {!isSpellingStation(config.stations[stationIndex]) && (
                  <p className="text-sm font-serif font-bold text-white capitalize mt-0.5">{sessionWords[wordIndex].word}</p>
                )}
              </div>

              <div className="flex-none flex items-center gap-3">
                {/* Streak */}
                <div className={`flex items-center gap-1 ${streak >= 2 ? 'text-orange-300' : 'text-white/40'}`}>
                  <Flame className={`w-4 h-4 ${streak >= 2 ? 'fill-orange-400/40' : ''}`} />
                  <span className="text-sm font-bold tabular-nums">
                    {streak > 0 ? `${streakMultiplier(streak).toFixed(2).replace(/\.00$/, '')}×` : '—'}
                  </span>
                </div>
                {/* Score */}
                <div className="relative text-right">
                  <p className="text-lg font-bold text-white tabular-nums leading-none">{score.toLocaleString()}</p>
                  {gain && (
                    <span
                      key={gain.id}
                      className="absolute -top-4 right-0 text-xs font-bold text-emerald-300 animate-fade-in-up"
                    >
                      +{gain.amount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Station stepper for the current word */}
            <div className="max-w-xl mx-auto mt-3 flex items-center gap-1.5">
              {config.stations.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < stationIndex ? 'bg-emerald-400' : i === stationIndex ? 'bg-white' : 'bg-white/15'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Station body */}
          <div className="flex-1 flex items-start sm:items-center justify-center px-4 py-4">
            {renderStation()}
          </div>

          {/* Teacher skip */}
          <div className="flex-none pb-5 flex justify-center">
            <button
              onClick={skipStation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" /> Skip station
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
