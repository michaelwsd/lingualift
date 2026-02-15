'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLinguaLift } from '@/contexts/LinguaLiftContext';
import { useRouter } from 'next/navigation';
import { StageIndicator } from '@/components/learning/StageIndicator';
import { PassageStage } from '@/components/learning/PassageStage';
import { ComprehensionStage } from '@/components/learning/ComprehensionStage';
import { PracticeStage } from '@/components/learning/PracticeStage';
import { SavedSession } from '@/types';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen, Brain, Puzzle, Save, Check } from 'lucide-react';

const STAGES = [
  { label: 'Reading', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Comprehension', icon: <Brain className="w-4 h-4" /> },
  { label: 'Practice', icon: <Puzzle className="w-4 h-4" /> },
];

const SESSIONS_KEY = 'lingualift-sessions';

export default function LearnPage() {
  const { passage, collectedWords, addCollectedWord, removeCollectedWord, setPassage, clearCollectedWords, fillInBlankExercise, setFillInBlankExercise, synonymExercise, setSynonymExercise } = useLinguaLift();
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!passage) {
      router.replace('/generate');
    }
  }, [passage, router]);

  if (!passage) return null;

  const goNext = () => {
    if (stage < 2) {
      setDirection('forward');
      setStage(s => s + 1);
    }
  };

  const goBack = () => {
    if (stage > 0) {
      setDirection('backward');
      setStage(s => s - 1);
    }
  };

  const handleNewPassage = () => {
    setPassage(null);
    clearCollectedWords();
    router.push('/generate');
  };

  const handleSaveSession = () => {
    const session: SavedSession = {
      id: crypto.randomUUID(),
      savedAt: Date.now(),
      passage,
      collectedWords,
      fillInBlankExercise,
      synonymExercise,
    };

    const existing = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]') as SavedSession[];
    existing.unshift(session);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(existing));

    setShowSaved(true);
    setTimeout(() => {
      setShowSaved(false);
      setPassage(null);
      clearCollectedWords();
      router.push('/generate');
    }, 1200);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Saved toast */}
      {showSaved && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl shadow-lg text-sm font-medium">
            <Check className="w-4 h-4" />
            Session saved!
          </div>
        </div>
      )}

      {/* Stage Indicator */}
      <div className="flex-none border-b border-stone-200/60 bg-white/60 backdrop-blur-sm">
        <StageIndicator currentStage={stage} stages={STAGES} />
      </div>

      {/* Stage Content */}
      <div className="flex-1 overflow-hidden px-5 lg:px-8 pt-4 pb-2">
        <div
          key={stage}
          className={`h-full ${direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
        >
          {stage === 0 && (
            <PassageStage
              passage={passage}
              collectedWords={collectedWords}
              onAddWord={addCollectedWord}
              onRemoveWord={removeCollectedWord}
            />
          )}
          {stage === 1 && (
            <ComprehensionStage passage={passage} />
          )}
          {stage === 2 && (
            <PracticeStage
              collectedWords={collectedWords}
              onGoBack={() => { setDirection('backward'); setStage(0); }}
              fillInBlankExercise={fillInBlankExercise}
              onFillInBlankGenerated={setFillInBlankExercise}
              synonymExercise={synonymExercise}
              onSynonymGenerated={setSynonymExercise}
            />
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex-none border-t border-stone-200/60 bg-white/60 backdrop-blur-sm px-5 lg:px-8 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            {stage > 0 ? (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {STAGES[stage - 1].label}
              </button>
            ) : (
              <button
                onClick={handleNewPassage}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Passage
              </button>
            )}
          </div>

          <div className="text-xs text-stone-400 font-medium">
            {collectedWords.length > 0 && `${collectedWords.length} words collected`}
          </div>

          <div>
            {stage < 2 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                {STAGES[stage + 1].label}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSaveSession}
                disabled={showSaved}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-sm disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                Save Session
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
