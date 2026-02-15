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
  fillInBlankExercises: FillInBlankExercise[] | null;
  setFillInBlankExercises: React.Dispatch<React.SetStateAction<FillInBlankExercise[] | null>>;
  synonymExercises: SynonymExercise[] | null;
  setSynonymExercises: React.Dispatch<React.SetStateAction<SynonymExercise[] | null>>;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  loadSession: (session: SavedSession) => void;
  currentSessionId: string | null;
}

const LinguaLiftContext = createContext<LinguaLiftContextType | null>(null);

export function LinguaLiftProvider({ children }: { children: React.ReactNode }) {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [collectedWords, setCollectedWords] = useState<CollectedWord[]>([]);
  const [fillInBlankExercises, setFillInBlankExercises] = useState<FillInBlankExercise[] | null>(null);
  const [synonymExercises, setSynonymExercises] = useState<SynonymExercise[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

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
    setFillInBlankExercises(null);
    setSynonymExercises(null);
    setCurrentSessionId(null);
  }, []);

  const loadSession = useCallback((session: SavedSession) => {
    setPassage(session.passage);
    setCollectedWords(session.collectedWords);
    setFillInBlankExercises(session.fillInBlankExercises);
    setSynonymExercises(session.synonymExercises);
    setCurrentSessionId(session.id);
  }, []);

  return (
    <LinguaLiftContext.Provider value={{
      passage, setPassage,
      collectedWords, addCollectedWord, removeCollectedWord, clearCollectedWords,
      fillInBlankExercises, setFillInBlankExercises,
      synonymExercises, setSynonymExercises,
      isGenerating, setIsGenerating,
      loadSession,
      currentSessionId,
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
