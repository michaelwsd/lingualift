'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Passage, CollectedWord, FillInBlankExercise, SynonymExercise, SavedSession } from '@/types';

interface LinguaLiftContextType {
  passage: Passage | null;
  setPassage: (p: Passage | null) => void;
  collectedWords: CollectedWord[];
  addCollectedWord: (word: CollectedWord) => void;
  removeCollectedWord: (id: string) => void;
  clearCollectedWords: () => void;
  fillInBlankExercise: FillInBlankExercise | null;
  setFillInBlankExercise: (e: FillInBlankExercise | null) => void;
  synonymExercise: SynonymExercise | null;
  setSynonymExercise: (e: SynonymExercise | null) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  loadSession: (session: SavedSession) => void;
}

const LinguaLiftContext = createContext<LinguaLiftContextType | null>(null);

export function LinguaLiftProvider({ children }: { children: React.ReactNode }) {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [collectedWords, setCollectedWords] = useState<CollectedWord[]>([]);
  const [fillInBlankExercise, setFillInBlankExercise] = useState<FillInBlankExercise | null>(null);
  const [synonymExercise, setSynonymExercise] = useState<SynonymExercise | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const addCollectedWord = useCallback((word: CollectedWord) => {
    setCollectedWords(prev => {
      if (prev.some(w => w.word.toLowerCase() === word.word.toLowerCase())) return prev;
      return [...prev, word];
    });
  }, []);

  const removeCollectedWord = useCallback((id: string) => {
    setCollectedWords(prev => prev.filter(w => w.id !== id));
  }, []);

  const clearCollectedWords = useCallback(() => {
    setCollectedWords([]);
    setFillInBlankExercise(null);
    setSynonymExercise(null);
  }, []);

  const loadSession = useCallback((session: SavedSession) => {
    setPassage(session.passage);
    setCollectedWords(session.collectedWords);
    setFillInBlankExercise(session.fillInBlankExercise);
    setSynonymExercise(session.synonymExercise);
  }, []);

  return (
    <LinguaLiftContext.Provider value={{
      passage, setPassage,
      collectedWords, addCollectedWord, removeCollectedWord, clearCollectedWords,
      fillInBlankExercise, setFillInBlankExercise,
      synonymExercise, setSynonymExercise,
      isGenerating, setIsGenerating,
      loadSession,
    }}>
      {children}
    </LinguaLiftContext.Provider>
  );
}

export function useLinguaLift() {
  const context = useContext(LinguaLiftContext);
  if (!context) throw new Error('useLinguaLift must be used within LinguaLiftProvider');
  return context;
}
