'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useLinguaLift } from '@/contexts/LinguaLiftContext';
import { useRouter } from 'next/navigation';
import { StageIndicator } from '@/components/learning/StageIndicator';
import { PassageStage } from '@/components/learning/PassageStage';
import { ComprehensionStage } from '@/components/learning/ComprehensionStage';
import { PracticeStage } from '@/components/learning/PracticeStage';
import { SavedSession, Passage, CollectedWord, FillInBlankExercise, SynonymExercise } from '@/types';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen, Brain, Puzzle, Save, Check, LogOut, GraduationCap, Send, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

const STAGES = [
  { label: 'Reading', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Comprehension', icon: <Brain className="w-4 h-4" /> },
  { label: 'Practice', icon: <Puzzle className="w-4 h-4" /> },
];

const SESSIONS_KEY = 'lingualift-sessions';

export default function LearnPage() {
  const { passage, collectedWords, addCollectedWord, removeCollectedWord, setPassage, clearCollectedWords, fillInBlankExercises, setFillInBlankExercises, synonymExercises, setSynonymExercises, currentSessionId } = useLinguaLift();
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [showSaved, setShowSaved] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [showComprehensionModal, setShowComprehensionModal] = useState(false);
  const [showPassageModal, setShowPassageModal] = useState(false);
  const [showHomeworkDropdown, setShowHomeworkDropdown] = useState(false);
  const homeworkDropdownRef = useRef<HTMLDivElement>(null);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (homeworkDropdownRef.current && !homeworkDropdownRef.current.contains(e.target as Node)) {
        setShowHomeworkDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      fillInBlankExercises,
      synonymExercises,
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
    setTimeout(() => setShowSaved(false), 1200);
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
      <div className="flex-1 overflow-hidden px-3 sm:px-5 lg:px-8 pt-4 pb-2">
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
              fillInBlankExercises={fillInBlankExercises}
              onFillInBlankGenerated={(groupIndex, exercise) => {
                setFillInBlankExercises(prev => {
                  const arr = prev ? [...prev] : [];
                  arr[groupIndex] = exercise;
                  return arr;
                });
              }}
              synonymExercises={synonymExercises}
              onSynonymGenerated={(groupIndex, exercise) => {
                setSynonymExercises(prev => {
                  const arr = prev ? [...prev] : [];
                  arr[groupIndex] = exercise;
                  return arr;
                });
              }}
            />
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex-none border-t border-stone-200/60 bg-white/60 backdrop-blur-sm px-3 sm:px-5 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-none">
            {stage > 0 ? (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{STAGES[stage - 1].label}</span>
              </button>
            ) : (
              <button
                onClick={handleNewPassage}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Passage</span>
              </button>
            )}
          </div>

          <div className="hidden sm:block text-xs text-stone-400 font-medium">
            {collectedWords.length > 0 && `${collectedWords.length} words collected`}
          </div>

          <div className="flex items-center flex-wrap justify-end gap-2">
            <button
              onClick={() => setShowPassageModal(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all shadow-sm hover:shadow-md"
              title="Send Passage"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send Passage</span>
            </button>
            {stage < 2 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 px-4 sm:px-5 py-2 text-sm font-medium text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                {STAGES[stage + 1].label}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveSession}
                  disabled={showSaved}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-sm disabled:opacity-60"
                  title="Save"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </button>
                <div className="relative" ref={homeworkDropdownRef}>
                  <button
                    onClick={() => setShowHomeworkDropdown(!showHomeworkDropdown)}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-lg transition-all shadow-sm hover:shadow-md"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Prepare Homework</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showHomeworkDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showHomeworkDropdown && (
                    <div className="absolute bottom-full mb-1 right-0 w-56 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-20 animate-fade-in">
                      <button
                        onClick={() => { setShowHomeworkDropdown(false); setShowHomeworkModal(true); }}
                        className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-stone-50 transition-colors flex items-center gap-2.5"
                      >
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        Vocabulary Homework
                      </button>
                      <div className="border-t border-stone-100" />
                      <button
                        onClick={() => { setShowHomeworkDropdown(false); setShowComprehensionModal(true); }}
                        className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-stone-50 transition-colors flex items-center gap-2.5"
                      >
                        <Brain className="w-4 h-4 text-teal-500" />
                        Comprehension Homework
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleExit}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors"
                  title="Exit"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit</span>
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
          onClose={() => setShowHomeworkModal(false)}
        />,
        document.body
      )}

      {showComprehensionModal && passage && createPortal(
        <ComprehensionHomeworkModal
          passage={passage}
          onClose={() => setShowComprehensionModal(false)}
        />,
        document.body
      )}

      {showPassageModal && passage && createPortal(
        <SendPassageModal
          passage={passage}
          onClose={() => setShowPassageModal(false)}
        />,
        document.body
      )}
    </div>
  );
}

function HomeworkModal({
  passage,
  collectedWords,
  onClose,
}: {
  passage: Passage;
  collectedWords: CollectedWord[];
  onClose: () => void;
}) {
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const handleSend = async () => {
    if (!selectedId || !selectedName) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/homework/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedId,
          studentName: selectedName,
          passage,
          collectedWords,
        }),
      });

      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
      setTimeout(onClose, 1200);
    } catch {
      setError('Failed to send homework. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={sending ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200/60 w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-slate-900">Prepare Vocabulary Homework</h2>
          {!sending && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100 transition-colors">
              <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {sent ? (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Homework sent to {selectedName}!</p>
          </div>
        ) : sending ? (
          <div className="px-5 py-8 text-center">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-900 mb-1">Preparing exercises...</p>
            <p className="text-xs text-stone-400">Generating practice questions for {selectedName}. This may take a moment.</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div>
              <p className="text-sm text-stone-500 mb-3">
                Send <span className="font-medium text-slate-700">&ldquo;{passage.title}&rdquo;</span> as homework
              </p>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {error}
              </div>
            )}

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
                  {selectedName ? (
                    <span className="flex items-center gap-2 text-slate-900">
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                      {selectedName}
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
                          onClick={() => { setSelectedId(s.id); setSelectedName(s.name); setDropdownOpen(false); }}
                          className={`w-full px-3 py-2 flex items-center gap-2.5 text-sm transition-colors duration-100 ${
                            selectedId === s.id
                              ? 'bg-indigo-50 text-indigo-900 font-medium'
                              : 'text-slate-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                            selectedId === s.id ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-100 text-stone-500'
                          }`}>
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          {s.name}
                          {selectedId === s.id && (
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
              disabled={!selectedId}
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

function ComprehensionHomeworkModal({
  passage,
  onClose,
}: {
  passage: Passage;
  onClose: () => void;
}) {
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const handleSend = async () => {
    if (!selectedId || !selectedName) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/homework/send-comprehension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedId,
          studentName: selectedName,
          passage,
        }),
      });

      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
      setTimeout(onClose, 1200);
    } catch {
      setError('Failed to send homework. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={sending ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200/60 w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-slate-900">Prepare Comprehension Homework</h2>
          {!sending && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100 transition-colors">
              <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {sent ? (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Comprehension homework sent to {selectedName}!</p>
          </div>
        ) : sending ? (
          <div className="px-5 py-8 text-center">
            <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-900 mb-1">Sending homework...</p>
            <p className="text-xs text-stone-400">Preparing comprehension homework for {selectedName}.</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div>
              <p className="text-sm text-stone-500 mb-2">
                Send <span className="font-medium text-slate-700">&ldquo;{passage.title}&rdquo;</span> as reading comprehension homework
              </p>
              <p className="text-xs text-stone-400">
                {passage.questions.length} comprehension questions will be included
              </p>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {error}
              </div>
            )}

            <div ref={dropdownRef}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select student</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg bg-stone-50/50 text-sm transition-all duration-150 ${
                    dropdownOpen
                      ? 'border-teal-500 ring-2 ring-teal-500/20'
                      : 'border-stone-300 hover:border-stone-400'
                  }`}
                >
                  {selectedName ? (
                    <span className="flex items-center gap-2 text-slate-900">
                      <GraduationCap className="w-4 h-4 text-teal-500" />
                      {selectedName}
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
                          onClick={() => { setSelectedId(s.id); setSelectedName(s.name); setDropdownOpen(false); }}
                          className={`w-full px-3 py-2 flex items-center gap-2.5 text-sm transition-colors duration-100 ${
                            selectedId === s.id
                              ? 'bg-teal-50 text-teal-900 font-medium'
                              : 'text-slate-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                            selectedId === s.id ? 'bg-teal-100 text-teal-700' : 'bg-stone-100 text-stone-500'
                          }`}>
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          {s.name}
                          {selectedId === s.id && (
                            <Check className="w-3.5 h-3.5 ml-auto text-teal-500" />
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
              disabled={!selectedId}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl shadow-md transition-all duration-200"
            >
              Send Comprehension Homework
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SendPassageModal({
  passage,
  onClose,
}: {
  passage: Passage;
  onClose: () => void;
}) {
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const handleSend = async () => {
    if (!selectedId) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/passages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedId,
          passage,
        }),
      });

      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
      setTimeout(onClose, 1200);
    } catch {
      setError('Failed to send passage. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={sending ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-stone-200/60 w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-slate-900">Send Passage</h2>
          {!sending && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100 transition-colors">
              <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {sent ? (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Passage sent to {selectedName}!</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div>
              <p className="text-sm text-stone-500 mb-3">
                Send <span className="font-medium text-slate-700">&ldquo;{passage.title}&rdquo;</span> as a reading passage
              </p>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {error}
              </div>
            )}

            <div ref={dropdownRef}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select student</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg bg-stone-50/50 text-sm transition-all duration-150 ${
                    dropdownOpen
                      ? 'border-teal-500 ring-2 ring-teal-500/20'
                      : 'border-stone-300 hover:border-stone-400'
                  }`}
                >
                  {selectedName ? (
                    <span className="flex items-center gap-2 text-slate-900">
                      <GraduationCap className="w-4 h-4 text-teal-500" />
                      {selectedName}
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
                          onClick={() => { setSelectedId(s.id); setSelectedName(s.name); setDropdownOpen(false); }}
                          className={`w-full px-3 py-2 flex items-center gap-2.5 text-sm transition-colors duration-100 ${
                            selectedId === s.id
                              ? 'bg-teal-50 text-teal-900 font-medium'
                              : 'text-slate-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                            selectedId === s.id ? 'bg-teal-100 text-teal-700' : 'bg-stone-100 text-stone-500'
                          }`}>
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          {s.name}
                          {selectedId === s.id && (
                            <Check className="w-3.5 h-3.5 ml-auto text-teal-500" />
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
              disabled={!selectedId || sending}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl shadow-md transition-all duration-200"
            >
              {sending ? 'Sending...' : 'Send Passage'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
