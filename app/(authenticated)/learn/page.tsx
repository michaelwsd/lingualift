'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useLinguaLift } from '@/contexts/LinguaLiftContext';
import { useRouter } from 'next/navigation';
import { StageIndicator } from '@/components/learning/StageIndicator';
import { PassageStage } from '@/components/learning/PassageStage';
import { ComprehensionStage } from '@/components/learning/ComprehensionStage';
import { PracticeStage } from '@/components/learning/PracticeStage';
import { SavedSession, Passage, CollectedWord, FillInBlankExercise, SynonymExercise } from '@/types';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen, Brain, Puzzle, Save, Check, LogOut, GraduationCap } from 'lucide-react';
import { createPortal } from 'react-dom';

const STAGES = [
  { label: 'Reading', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Comprehension', icon: <Brain className="w-4 h-4" /> },
  { label: 'Practice', icon: <Puzzle className="w-4 h-4" /> },
];

const SESSIONS_KEY = 'lingualift-sessions';

export default function LearnPage() {
  const { passage, collectedWords, addCollectedWord, removeCollectedWord, setPassage, clearCollectedWords, fillInBlankExercise, setFillInBlankExercise, synonymExercise, setSynonymExercise, currentSessionId } = useLinguaLift();
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [showSaved, setShowSaved] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (!passage) {
      router.replace('/generate');
    }
  }, [passage, router]);

  if (!passage) return null;

  const goNext = () => {
    if (stage < 2) {
      setHasNavigated(true);
      setDirection('forward');
      setStage(s => s + 1);
    }
  };

  const goBack = () => {
    if (stage > 0) {
      setHasNavigated(true);
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
      id: currentSessionId || crypto.randomUUID(),
      savedAt: Date.now(),
      passage,
      collectedWords,
      fillInBlankExercise,
      synonymExercise,
    };

    const existing = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]') as SavedSession[];

    if (currentSessionId) {
      const idx = existing.findIndex(s => s.id === currentSessionId);
      if (idx !== -1) {
        existing[idx] = session;
      } else {
        existing.unshift(session);
      }
    } else {
      existing.unshift(session);
    }

    localStorage.setItem(SESSIONS_KEY, JSON.stringify(existing));

    setShowSaved(true);
    setTimeout(() => {
      setShowSaved(false);
      setPassage(null);
      clearCollectedWords();
      router.push('/generate');
    }, 1200);
  };

  const handleExit = () => {
    setPassage(null);
    clearCollectedWords();
    router.push('/generate');
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
          className={`h-full ${hasNavigated ? (direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left') : ''}`}
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

          <div className="flex items-center gap-2">
            {stage < 2 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                {STAGES[stage + 1].label}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveSession}
                  disabled={showSaved}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-sm disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  onClick={() => setShowHomeworkModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Prepare Homework
                </button>
                <button
                  onClick={handleExit}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Exit
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showHomeworkModal && passage && createPortal(
        <HomeworkModal
          passage={passage}
          collectedWords={collectedWords}
          fillInBlankExercise={fillInBlankExercise}
          synonymExercise={synonymExercise}
          onClose={() => setShowHomeworkModal(false)}
        />,
        document.body
      )}
    </div>
  );
}

const HOMEWORK_KEY = 'lingualift-homework';

interface HomeworkAssignment {
  id: string;
  studentName: string;
  assignedAt: number;
  passage: Passage;
  collectedWords: CollectedWord[];
  fillInBlankExercise: FillInBlankExercise | null;
  synonymExercise: SynonymExercise | null;
}

function HomeworkModal({
  passage,
  collectedWords,
  fillInBlankExercise,
  synonymExercise,
  onClose,
}: {
  passage: Passage;
  collectedWords: CollectedWord[];
  fillInBlankExercise: FillInBlankExercise | null;
  synonymExercise: SynonymExercise | null;
  onClose: () => void;
}) {
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetch('/api/students')
      .then(res => res.json())
      .then(data => setStudents(data.students || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSend = () => {
    if (!selected) return;

    const assignment: HomeworkAssignment = {
      id: crypto.randomUUID(),
      studentName: selected,
      assignedAt: Date.now(),
      passage,
      collectedWords,
      fillInBlankExercise,
      synonymExercise,
    };

    const existing = JSON.parse(localStorage.getItem(HOMEWORK_KEY) || '[]') as HomeworkAssignment[];
    existing.unshift(assignment);
    localStorage.setItem(HOMEWORK_KEY, JSON.stringify(existing));

    setSent(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200/60 w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-slate-900">Prepare Homework</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100 transition-colors">
            <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {sent ? (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Homework sent to {selected}!</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div>
              <p className="text-sm text-stone-500 mb-3">
                Send <span className="font-medium text-slate-700">&ldquo;{passage.title}&rdquo;</span> as homework
              </p>
            </div>

            <div ref={dropdownRef}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select student</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg bg-stone-50/50 text-sm transition-all duration-150 ${
                    dropdownOpen
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-stone-300 hover:border-stone-400'
                  }`}
                >
                  {selected ? (
                    <span className="flex items-center gap-2 text-slate-900">
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                      {selected}
                    </span>
                  ) : (
                    <span className="text-stone-400">Choose a student...</span>
                  )}
                  <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${dropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
                </button>

                <div className={`absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden transition-all duration-200 origin-top ${
                  dropdownOpen ? 'opacity-100 scale-y-100 z-10' : 'opacity-0 scale-y-95 pointer-events-none'
                }`}>
                  {loading ? (
                    <div className="px-3 py-3 flex items-center gap-2 text-xs text-stone-400">
                      <div className="w-3 h-3 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                      Loading students...
                    </div>
                  ) : students.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-stone-400">No students have registered yet.</div>
                  ) : (
                    <div className="py-1 max-h-48 overflow-y-auto">
                      {students.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setSelected(s.name); setDropdownOpen(false); }}
                          className={`w-full px-3 py-2 flex items-center gap-2.5 text-sm transition-colors duration-100 ${
                            selected === s.name
                              ? 'bg-indigo-50 text-indigo-900 font-medium'
                              : 'text-slate-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                            selected === s.name ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-100 text-stone-500'
                          }`}>
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          {s.name}
                          {selected === s.name && (
                            <Check className="w-3.5 h-3.5 ml-auto text-indigo-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={!selected}
              className="w-full py-2.5 bg-[#1e1b4b] hover:bg-indigo-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl shadow-md transition-all duration-200"
            >
              Send Homework
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
