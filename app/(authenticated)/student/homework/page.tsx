'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchHomeworkList, fetchPassages, HomeworkListItem, PassageListItem } from '@/services/api';
import { GraduationCap, Clock, BookOpen, ChevronRight, Loader2, FileText, Brain, CalendarClock, Lock } from 'lucide-react';
import { dueInfo, DUE_TONE_CLASSES } from '@/lib/dueDate';

interface Lesson {
  dateKey: string;
  dateLabel: string;
  timestamp: number;
  homework: HomeworkListItem[];
  passages: PassageListItem[];
}

const statusConfig = {
  pending: { label: 'New', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Returns a "locked until" label if the homework isn't unlocked yet, else null. */
function lockLabel(unlockDate: string | null | undefined): string | null {
  if (!unlockDate) return null;
  const d = new Date(unlockDate);
  if (isNaN(d.getTime()) || d.getTime() <= Date.now()) return null;
  const days = Math.round((startOfDay(d) - startOfDay(new Date())) / 86400000);
  if (days <= 0) return 'Unlocks later today';
  if (days === 1) return 'Unlocks tomorrow';
  return `Unlocks in ${days} days`;
}

export default function StudentHomeworkPage() {
  const [assignments, setAssignments] = useState<HomeworkListItem[]>([]);
  const [passages, setPassages] = useState<PassageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetchHomeworkList().catch(() => [] as HomeworkListItem[]),
      fetchPassages().catch(() => [] as PassageListItem[]),
    ]).then(([hw, ps]) => {
      setAssignments(hw);
      setPassages(ps);
    }).finally(() => setLoading(false));
  }, []);

  // Which days of each plan the student has already completed.
  const completedDaysByPlan = useMemo(() => {
    const m = new Map<string, Set<number>>();
    for (const hw of assignments) {
      if (hw.plan && hw.status === 'completed') {
        if (!m.has(hw.plan.planId)) m.set(hw.plan.planId, new Set());
        m.get(hw.plan.planId)!.add(hw.plan.day);
      }
    }
    return m;
  }, [assignments]);

  // Group everything into lessons — one lesson per calendar day it was sent.
  const lessons = useMemo(() => {
    const map = new Map<string, Lesson>();
    const dayKey = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    };
    const ensure = (iso: string): Lesson => {
      const key = dayKey(iso);
      let lesson = map.get(key);
      if (!lesson) {
        lesson = { dateKey: key, dateLabel: formatDate(iso), timestamp: startOfDay(new Date(iso)), homework: [], passages: [] };
        map.set(key, lesson);
      }
      return lesson;
    };

    for (const hw of assignments) ensure(hw.assignedAt).homework.push(hw);
    for (const p of passages) ensure(p.sentAt).passages.push(p);

    // Keep a plan's days together and in Day 1→N order; other homework by time.
    const sortKey = (hw: HomeworkListItem) =>
      hw.plan ? `0:${hw.plan.planId}:${String(hw.plan.day).padStart(4, '0')}` : `1:${hw.assignedAt}`;
    const arr = Array.from(map.values());
    for (const l of arr) {
      l.homework.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    }
    return arr.sort((a, b) => b.timestamp - a.timestamp);
  }, [assignments, passages]);

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

  const totalLessons = lessons.length;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">My Homework</h1>
          <p className="text-sm text-stone-500">
            {totalLessons === 0
              ? 'No homework assigned yet. Check back later!'
              : `${totalLessons} lesson${totalLessons !== 1 ? 's' : ''}`}
          </p>
        </div>

        {totalLessons === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-sm text-stone-400 font-medium mb-1">No homework yet</p>
            <p className="text-xs text-stone-300">Your teacher will assign homework here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {lessons.map((lesson, idx) => {
              const lessonNumber = totalLessons - idx;
              const itemCount = lesson.homework.length + lesson.passages.length;
              return (
                <div key={lesson.dateKey} className="animate-card-in" style={{ animationDelay: `${idx * 60}ms` }}>
                  {/* Lesson header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1e1b4b] text-white text-xs font-bold">
                        {lessonNumber}
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-slate-800">Lesson {lessonNumber}</h2>
                        <p className="text-[11px] text-stone-400">{lesson.dateLabel}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {/* Reading passages sent this day */}
                    {lesson.passages.map(passage => (
                      <div
                        key={`p-${passage.id}`}
                        onClick={() => router.push(`/student/passage/${passage.id}?source=passage`)}
                        className="bg-white rounded-lg border border-stone-200/70 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group/row"
                      >
                        <div className="px-4 py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-md bg-teal-50 flex items-center justify-center flex-none">
                              <FileText className="w-3.5 h-3.5 text-teal-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-800 truncate">{passage.title}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-teal-50 text-teal-700 border-teal-200">
                                  Reading
                                </span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone-300 group-hover/row:text-stone-500 group-hover/row:translate-x-0.5 transition-all flex-none" />
                        </div>
                      </div>
                    ))}

                    {/* Homework sent this day */}
                    {lesson.homework.map(hw => {
                      const status = statusConfig[hw.status];
                      const isComprehension = hw.homeworkType === 'comprehension';
                      // A plan day unlocks only when its date has arrived AND the
                      // previous day is completed.
                      let locked: string | null = null;
                      if (hw.plan) {
                        const dateLock = lockLabel(hw.plan.unlockDate);
                        if (dateLock) {
                          locked = dateLock;
                        } else if (hw.plan.day > 1 && !completedDaysByPlan.get(hw.plan.planId)?.has(hw.plan.day - 1)) {
                          locked = `Finish Day ${hw.plan.day - 1} first`;
                        }
                      }
                      const label = isComprehension
                        ? 'Reading Comprehension'
                        : hw.plan
                        ? `Practice Plan · Day ${hw.plan.day}`
                        : 'Vocabulary Homework';
                      const di = dueInfo(hw.dueDate, hw.status === 'completed');

                      return (
                        <div
                          key={hw.id}
                          onClick={() => !locked && router.push(`/student/homework/${hw.id}`)}
                          className={`bg-white rounded-lg border shadow-sm transition-all duration-200 ${
                            locked
                              ? 'border-stone-200/70 opacity-70 cursor-not-allowed'
                              : 'border-stone-200/70 hover:shadow-md cursor-pointer group/row'
                          }`}
                        >
                          <div className="px-4 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-none ${
                                locked ? 'bg-stone-100' : isComprehension ? 'bg-teal-50' : 'bg-indigo-50'
                              }`}>
                                {locked ? (
                                  <Lock className="w-3.5 h-3.5 text-stone-400" />
                                ) : isComprehension ? (
                                  <Brain className="w-3.5 h-3.5 text-teal-600" />
                                ) : (
                                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-slate-800">
                                    {label}
                                  </span>
                                  {locked ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-stone-100 text-stone-500 border-stone-200">
                                      <Lock className="w-2.5 h-2.5" />
                                      {locked}
                                    </span>
                                  ) : (
                                    <>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${status.bg} ${status.text} ${status.border}`}>
                                        {status.label}
                                      </span>
                                      {di && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${DUE_TONE_CLASSES[di.tone]}`}>
                                          <CalendarClock className="w-2.5 h-2.5" />
                                          {di.label}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {formatDate(hw.assignedAt)}
                                  </span>
                                  {isComprehension ? (
                                    <span className="flex items-center gap-1">
                                      <Brain className="w-2.5 h-2.5" />
                                      {hw.questionCount || 0} questions
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <BookOpen className="w-2.5 h-2.5" />
                                      {hw.wordCount} words
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {!locked && (
                              <ChevronRight className="w-4 h-4 text-stone-300 group-hover/row:text-stone-500 group-hover/row:translate-x-0.5 transition-all flex-none" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
