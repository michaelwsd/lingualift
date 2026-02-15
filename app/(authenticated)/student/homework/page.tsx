'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchHomeworkList, fetchPassages, HomeworkListItem, PassageListItem } from '@/services/api';
import { GraduationCap, Clock, BookOpen, ChevronRight, Loader2, FileText } from 'lucide-react';

interface PassageGroup {
  passageId: string;
  title: string;
  type: string;
  /** The earliest date across sent passage and homework */
  date: string;
  /** The sent_passages row ID (if teacher explicitly sent the passage) */
  sentPassageId: string | null;
  /** First homework ID — used to fetch passage data for homework-only groups */
  firstHomeworkId: string | null;
  homework: HomeworkListItem[];
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

  const groups = useMemo(() => {
    const map = new Map<string, PassageGroup>();

    // Add sent passages first
    for (const p of passages) {
      map.set(p.passageId, {
        passageId: p.passageId,
        title: p.title,
        type: p.type,
        date: p.sentAt,
        sentPassageId: p.id,
        firstHomeworkId: null,
        homework: [],
      });
    }

    // Add homework, grouped by passage ID
    for (const hw of assignments) {
      const key = hw.passageId || hw.id; // fallback to hw.id if no passageId
      const existing = map.get(key);
      if (existing) {
        existing.homework.push(hw);
        if (!existing.firstHomeworkId) existing.firstHomeworkId = hw.id;
      } else {
        map.set(key, {
          passageId: key,
          title: hw.passageTitle,
          type: hw.passageType,
          date: hw.assignedAt,
          sentPassageId: null,
          firstHomeworkId: hw.id,
          homework: [hw],
        });
      }
    }

    // Sort groups by date (most recent first)
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [assignments, passages]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusConfig = {
    pending: { label: 'New', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    in_progress: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  };

  const handlePassageClick = (group: PassageGroup) => {
    if (group.sentPassageId) {
      router.push(`/student/passage/${group.sentPassageId}?source=passage`);
    } else if (group.firstHomeworkId) {
      router.push(`/student/passage/${group.firstHomeworkId}?source=homework`);
    }
  };

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

  const totalItems = groups.length;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">My Homework</h1>
          <p className="text-sm text-stone-500">
            {totalItems === 0
              ? 'No homework assigned yet. Check back later!'
              : `${totalItems} passage${totalItems !== 1 ? 's' : ''}`}
          </p>
        </div>

        {totalItems === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-sm text-stone-400 font-medium mb-1">No homework yet</p>
            <p className="text-xs text-stone-300">Your teacher will assign homework here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group, idx) => (
              <div
                key={group.passageId}
                className="animate-card-in"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Passage card (parent) */}
                <div
                  onClick={() => handlePassageClick(group)}
                  className="bg-white rounded-xl border border-stone-200/80 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-none">
                            <FileText className="w-4 h-4 text-teal-600" />
                          </div>
                          <h3 className="text-base font-bold text-slate-900 font-serif truncate">
                            {group.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-stone-400 ml-10.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(group.date)}
                          </span>
                          {group.type && (
                            <span className="text-stone-300">{group.type}</span>
                          )}
                          {group.homework.length === 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-teal-50 text-teal-700 border-teal-200">
                              Reading
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all flex-none mt-1" />
                    </div>
                  </div>
                </div>

                {/* Homework cards (children) */}
                {group.homework.length > 0 && (
                  <div className="ml-4 sm:ml-6 mt-1 space-y-1">
                    {group.homework.map((hw) => {
                      const status = statusConfig[hw.status];

                      return (
                        <div
                          key={hw.id}
                          onClick={() => router.push(`/student/homework/${hw.id}`)}
                          className="bg-white rounded-lg border border-stone-200/60 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group/hw"
                        >
                          <div className="px-4 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 bg-indigo-50 rounded-md flex items-center justify-center flex-none">
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-800">
                                    Homework
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${status.bg} ${status.text} ${status.border}`}>
                                    {status.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {formatDate(hw.assignedAt)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="w-2.5 h-2.5" />
                                    {hw.wordCount} words
                                  </span>
                                </div>
                              </div>
                            </div>

                            <ChevronRight className="w-4 h-4 text-stone-300 group-hover/hw:text-stone-500 group-hover/hw:translate-x-0.5 transition-all flex-none" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
