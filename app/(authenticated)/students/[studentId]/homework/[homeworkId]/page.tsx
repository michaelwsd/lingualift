'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchHomework } from '@/services/api';
import { HomeworkAssignment, HomeworkProgress } from '@/types';
import {
  ArrowLeft,
  Loader2,
  ListChecks,
  BookOpen,
  ArrowRightLeft,
  Layers,
  Check,
  X,
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

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-10">
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
            {progress && (
              <> &middot; Score: {progress.score} &middot; Phase: {progress.current_phase.replace('_', ' ')}</>
            )}
          </p>
        </div>

        {/* Collected Words */}
        <Section title="Vocabulary Words" icon={<BookOpen className="w-4 h-4" />}>
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

        {/* MC Definition Questions */}
        <Section title="Definition Questions" icon={<ListChecks className="w-4 h-4" />}>
          <div className="space-y-3">
            {assignment.mc_definitions.map((q, i) => (
              <QuestionCard key={q.wordId} index={i + 1}>
                <p className="text-sm font-semibold text-slate-800 capitalize mb-2">
                  What does &ldquo;{q.word}&rdquo; mean?
                </p>
                <div className="space-y-1">
                  {q.options.map((opt, j) => (
                    <div
                      key={j}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs ${
                        opt === q.correctDefinition
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'text-stone-500'
                      }`}
                    >
                      {opt === q.correctDefinition ? (
                        <Check className="w-3 h-3 text-emerald-500 flex-none" />
                      ) : (
                        <span className="w-3 h-3 flex-none" />
                      )}
                      {opt}
                    </div>
                  ))}
                </div>
              </QuestionCard>
            ))}
          </div>
        </Section>

        {/* MC Synonym Questions */}
        <Section title="Synonym Questions" icon={<BookOpen className="w-4 h-4" />}>
          <div className="space-y-3">
            {assignment.mc_synonyms.map((q, i) => (
              <QuestionCard key={q.wordId} index={i + 1}>
                <p className="text-sm font-semibold text-slate-800 capitalize mb-2">
                  Which word is a synonym of &ldquo;{q.word}&rdquo;?
                </p>
                <div className="space-y-1">
                  {q.options.map((opt, j) => (
                    <div
                      key={j}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs ${
                        opt === q.correctSynonym
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'text-stone-500'
                      }`}
                    >
                      {opt === q.correctSynonym ? (
                        <Check className="w-3 h-3 text-emerald-500 flex-none" />
                      ) : (
                        <span className="w-3 h-3 flex-none" />
                      )}
                      {opt}
                    </div>
                  ))}
                </div>
              </QuestionCard>
            ))}
          </div>
        </Section>

        {/* Cross Matching */}
        <Section title="Word Matching" icon={<ArrowRightLeft className="w-4 h-4" />}>
          <div className="bg-white rounded-lg border border-stone-200/80 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Words</p>
                <div className="space-y-1.5">
                  {assignment.cross_matching_data.words.map(w => (
                    <div key={w.id} className="px-3 py-1.5 rounded-md bg-stone-50 text-xs font-medium text-slate-700 capitalize">
                      {w.text}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Definitions</p>
                <div className="space-y-1.5">
                  {assignment.cross_matching_data.definitions.map(d => (
                    <div key={d.id} className="px-3 py-1.5 rounded-md bg-stone-50 text-xs text-stone-600">
                      {d.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Synonym Groups */}
        <Section title="Synonym Groups" icon={<Layers className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-3">
            {assignment.synonym_groups.groups.map(group => (
              <div key={group.word} className="bg-white rounded-lg border border-stone-200/80 p-4">
                <h4 className="text-sm font-bold text-slate-800 capitalize mb-2">{group.word}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {group.synonyms.map((syn, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium">
                      {syn}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-stone-400">{icon}</span>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h2>
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
