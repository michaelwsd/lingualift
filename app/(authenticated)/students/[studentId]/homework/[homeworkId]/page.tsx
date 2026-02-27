'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchHomework } from '@/services/api';
import { HomeworkAssignment, HomeworkProgress, PracticeQuestion } from '@/types';
import {
  ArrowLeft,
  Loader2,
  ListChecks,
  BookOpen,
  ArrowRightLeft,
  Layers,
  PenLine,
  Check,
} from 'lucide-react';

export default function HomeworkQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const homeworkId = params.homeworkId as string;

  const [assignment, setAssignment] = useState<HomeworkAssignment | null>(null);
  const [progress, setProgress] = useState<HomeworkProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomework(homeworkId)
      .then(({ assignment: hw, progress: p }) => {
        setAssignment(hw);
        setProgress(p);
      })
      .catch(() => router.push(`/students/${studentId}`))
      .finally(() => setLoading(false));
  }, [homeworkId, studentId, router]);

  // Group practice questions by type
  const questionsByType = useMemo(() => {
    if (!assignment?.generated_exercises) return null;
    const qs = assignment.generated_exercises.practiceQuestions;
    const grouped: Record<string, PracticeQuestion[]> = {};
    for (const q of qs) {
      if (!grouped[q.type]) grouped[q.type] = [];
      grouped[q.type].push(q);
    }
    return grouped;
  }, [assignment]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-400">Loading homework...</p>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  const statusConfig = {
    pending: { label: 'New', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    in_progress: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  };
  const status = statusConfig[assignment.status];

  const exercises = assignment.generated_exercises;
  const hasExercises = exercises && (
    exercises.practiceQuestions.length > 0 ||
    exercises.passageFillExercises.length > 0 ||
    exercises.wordMatchingExercises.length > 0 ||
    exercises.wordMatchingExercises.length > 0
  );

  // Count totals
  const totalItems = hasExercises
    ? exercises.practiceQuestions.length +
      exercises.passageFillExercises.length +
      exercises.wordMatchingExercises.length
    : 0;

  const typeConfig = {
    mc_definition: { title: 'Definition Questions', icon: <ListChecks className="w-4 h-4" />, promptPrefix: 'What does', promptSuffix: 'mean?' },
    mc_synonym: { title: 'Synonym Questions', icon: <BookOpen className="w-4 h-4" />, promptPrefix: 'Which word is a synonym of', promptSuffix: '?' },
    matching: { title: 'Definition → Word Matching', icon: <ArrowRightLeft className="w-4 h-4" />, promptPrefix: '', promptSuffix: '' },
    fill_in_blank: { title: 'Fill in the Blank', icon: <PenLine className="w-4 h-4" />, promptPrefix: '', promptSuffix: '' },
    grouping: { title: 'Synonym Grouping', icon: <Layers className="w-4 h-4" />, promptPrefix: 'Which word is', promptSuffix: 'a synonym of?' },
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <button
            onClick={() => router.push(`/students/${studentId}`)}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to homework list
          </button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-serif font-bold text-slate-900">
              {assignment.passage.title}
            </h1>
            <span className={`flex-none px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${status.bg} ${status.text} ${status.border}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-stone-500">
            {assignment.collected_words.length} words &middot; {assignment.passage.type}
            {totalItems > 0 && <> &middot; {totalItems} exercises</>}
            {progress && (
              <> &middot; Phase: {progress.current_phase.replace('_', ' ')}</>
            )}
          </p>
        </div>

        {/* Collected Words */}
        <Section title="Vocabulary Words" icon={<BookOpen className="w-4 h-4" />} count={assignment.collected_words.length}>
          <div className="space-y-2">
            {assignment.collected_words.map((word, i) => (
              <div
                key={word.id}
                className="bg-white rounded-lg border border-stone-200/80 p-4 animate-card-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 capitalize">{word.word}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">{word.meaning}</p>
                    <p className="text-xs text-stone-400 italic mt-1">&ldquo;{word.exampleSentence}&rdquo;</p>
                  </div>
                  <span className="text-[10px] text-stone-300 font-medium flex-none">#{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Generated Practice Questions by Type */}
        {hasExercises && questionsByType && (
          <>
            {/* MC Definition */}
            {questionsByType.mc_definition && (
              <Section title={typeConfig.mc_definition.title} icon={typeConfig.mc_definition.icon} count={questionsByType.mc_definition.length}>
                <div className="space-y-3">
                  {questionsByType.mc_definition.map((q, i) => (
                    <QuestionCard key={q.id} index={i + 1}>
                      <p className="text-sm font-semibold text-slate-800 capitalize mb-2">
                        What does &ldquo;{q.prompt}&rdquo; mean?
                      </p>
                      <OptionsList options={q.options} correctAnswer={q.correctAnswer} />
                    </QuestionCard>
                  ))}
                </div>
              </Section>
            )}

            {/* MC Synonym */}
            {questionsByType.mc_synonym && (
              <Section title={typeConfig.mc_synonym.title} icon={typeConfig.mc_synonym.icon} count={questionsByType.mc_synonym.length}>
                <div className="space-y-3">
                  {questionsByType.mc_synonym.map((q, i) => (
                    <QuestionCard key={q.id} index={i + 1}>
                      <p className="text-sm font-semibold text-slate-800 capitalize mb-2">
                        Which word is a synonym of &ldquo;{q.prompt}&rdquo;?
                      </p>
                      <OptionsList options={q.options} correctAnswer={q.correctAnswer} />
                    </QuestionCard>
                  ))}
                </div>
              </Section>
            )}

            {/* Matching (definition → word) */}
            {questionsByType.matching && (
              <Section title={typeConfig.matching.title} icon={typeConfig.matching.icon} count={questionsByType.matching.length}>
                <div className="space-y-3">
                  {questionsByType.matching.map((q, i) => (
                    <QuestionCard key={q.id} index={i + 1}>
                      <p className="text-xs text-stone-400 mb-1">Which word matches this definition?</p>
                      <p className="text-sm text-slate-700 mb-2">{q.prompt}</p>
                      <OptionsList options={q.options} correctAnswer={q.correctAnswer} capitalize />
                    </QuestionCard>
                  ))}
                </div>
              </Section>
            )}

            {/* Fill in blank */}
            {questionsByType.fill_in_blank && (
              <Section title={typeConfig.fill_in_blank.title} icon={typeConfig.fill_in_blank.icon} count={questionsByType.fill_in_blank.length}>
                <div className="space-y-3">
                  {questionsByType.fill_in_blank.map((q, i) => (
                    <QuestionCard key={q.id} index={i + 1}>
                      <p className="text-sm text-slate-700 italic mb-2">&ldquo;{q.prompt}&rdquo;</p>
                      <OptionsList options={q.options} correctAnswer={q.correctAnswer} capitalize />
                    </QuestionCard>
                  ))}
                </div>
              </Section>
            )}

            {/* Grouping */}
            {questionsByType.grouping && (
              <Section title={typeConfig.grouping.title} icon={typeConfig.grouping.icon} count={questionsByType.grouping.length}>
                <div className="space-y-3">
                  {questionsByType.grouping.map((q, i) => (
                    <QuestionCard key={q.id} index={i + 1}>
                      <p className="text-xs text-stone-400 mb-1">Which word is this a synonym of?</p>
                      <p className="text-sm font-semibold text-slate-800 capitalize mb-2">&ldquo;{q.prompt}&rdquo;</p>
                      <OptionsList options={q.options} correctAnswer={q.correctAnswer} capitalize />
                    </QuestionCard>
                  ))}
                </div>
              </Section>
            )}

            {/* Passage Fill Exercises */}
            {exercises.passageFillExercises.length > 0 && (
              <Section title="Passage Fill Exercises" icon={<PenLine className="w-4 h-4" />} count={exercises.passageFillExercises.length}>
                <div className="space-y-4">
                  {exercises.passageFillExercises.map((ex, i) => (
                    <div key={ex.id} className="bg-white rounded-lg border border-stone-200/80 p-4 animate-card-in" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Passage {i + 1}</span>
                        <span className="text-[10px] text-stone-400">{ex.answers.length} blanks</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3 whitespace-pre-wrap">
                        {ex.passage}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-1">Answers:</span>
                        {ex.answers.map((ans, j) => (
                          <span key={j} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium capitalize">
                            {j}: {ans}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Word Matching Exercises */}
            {exercises.wordMatchingExercises.length > 0 && (
              <Section title="Word Matching Exercises" icon={<ArrowRightLeft className="w-4 h-4" />} count={exercises.wordMatchingExercises.length}>
                <div className="space-y-4">
                  {exercises.wordMatchingExercises.map((ex, i) => (
                    <div key={ex.id} className="bg-white rounded-lg border border-stone-200/80 p-4 animate-card-in" style={{ animationDelay: `${i * 60}ms` }}>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3 block">
                        Set {i + 1} &middot; {ex.words.length} pairs
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Words</p>
                          <div className="space-y-1.5">
                            {ex.words.map(w => (
                              <div key={w.id} className="px-3 py-1.5 rounded-md bg-stone-50 text-xs font-medium text-slate-700 capitalize">
                                {w.text}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Definitions</p>
                          <div className="space-y-1.5">
                            {ex.definitions.map(d => (
                              <div key={d.id} className="px-3 py-1.5 rounded-md bg-stone-50 text-xs text-stone-600">
                                {d.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children, count }: { title: string; icon: React.ReactNode; children: React.ReactNode; count?: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-stone-400">{icon}</span>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h2>
        {count !== undefined && (
          <span className="text-[10px] font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function QuestionCard({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-stone-200/80 p-4 animate-card-in" style={{ animationDelay: `${(index - 1) * 40}ms` }}>
      <div className="flex items-start gap-3">
        <span className="flex-none w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-500">
          {index}
        </span>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function OptionsList({ options, correctAnswer, capitalize }: { options: string[]; correctAnswer: string; capitalize?: boolean }) {
  return (
    <div className="space-y-1">
      {options.map((opt, j) => (
        <div
          key={j}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs ${
            opt === correctAnswer
              ? 'bg-emerald-50 text-emerald-700 font-medium'
              : 'text-stone-500'
          }`}
        >
          {opt === correctAnswer ? (
            <Check className="w-3 h-3 text-emerald-500 flex-none" />
          ) : (
            <span className="w-3 h-3 flex-none" />
          )}
          <span className={capitalize ? 'capitalize' : ''}>{opt}</span>
        </div>
      ))}
    </div>
  );
}
