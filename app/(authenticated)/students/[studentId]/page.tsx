'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchHomeworkByStudent, fetchStudents, fetchPassagesByStudent, deleteHomework, deletePassage, HomeworkListItem, StudentItem, PassageListItem } from '@/services/api';
import { ArrowLeft, Clock, BookOpen, ChevronRight, Loader2, GraduationCap, Trash2, Eye, PlayCircle, CheckCircle2, Circle, FileText, Brain, CalendarClock, CalendarRange } from 'lucide-react';
import { dueInfo, DUE_TONE_CLASSES } from '@/lib/dueDate';
import { PracticePlanModal } from '@/components/homework/PracticePlanModal';

const progressConfig = {
  not_started: {
    label: 'Not Started',
    icon: Circle,
    bg: 'bg-stone-50',
    text: 'text-stone-500',
    border: 'border-stone-200',
    iconColor: 'text-stone-400',
  },
  started: {
    label: 'Started',
    icon: Eye,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    iconColor: 'text-blue-500',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircle,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    iconColor: 'text-amber-500',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-500',
  },
};

interface PassageGroup {
  passageId: string;
  title: string;
  type: string;
  date: string;
  sentPassageId: string | null;
  firstHomeworkId: string | null;
  viewed: boolean | null;
  homework: HomeworkListItem[];
}

export default function StudentHomeworkListPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const [student, setStudent] = useState<StudentItem | null>(null);
  const [assignments, setAssignments] = useState<HomeworkListItem[]>([]);
  const [passages, setPassages] = useState<PassageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'homework' | 'passage' } | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const reloadHomework = useCallback(() => {
    fetchHomeworkByStudent(studentId).then(setAssignments).catch(() => {});
  }, [studentId]);

  useEffect(() => {
    Promise.all([
      fetchStudents().catch(() => [] as StudentItem[]),
      fetchHomeworkByStudent(studentId).catch(() => [] as HomeworkListItem[]),
      fetchPassagesByStudent(studentId).catch(() => [] as PassageListItem[]),
    ]).then(([students, hw, ps]) => {
      setStudent(students.find(s => s.id === studentId) || null);
      setAssignments(hw);
      setPassages(ps);
    }).finally(() => setLoading(false));
  }, [studentId]);

  const groups = useMemo(() => {
    const map = new Map<string, PassageGroup>();

    for (const p of passages) {
      map.set(p.passageId, {
        passageId: p.passageId,
        title: p.title,
        type: p.type,
        date: p.sentAt,
        sentPassageId: p.id,
        firstHomeworkId: null,
        viewed: p.viewed ?? null,
        homework: [],
      });
    }

    for (const hw of assignments) {
      // All days of one practice plan group under a single card.
      const key = hw.plan ? `plan:${hw.plan.planId}` : (hw.passageId || hw.id);
      const existing = map.get(key);
      if (existing) {
        existing.homework.push(hw);
        if (!existing.firstHomeworkId) existing.firstHomeworkId = hw.id;
      } else {
        map.set(key, {
          passageId: key,
          title: hw.plan ? 'Practice Plan' : hw.passageTitle,
          type: hw.plan ? `${hw.plan.totalDays}-day plan · ${hw.wordCount} words/day` : hw.passageType,
          date: hw.assignedAt,
          sentPassageId: null,
          firstHomeworkId: hw.id,
          viewed: null,
          homework: [hw],
        });
      }
    }

    // Order homework within each group — plan days by day number, else by time.
    for (const g of map.values()) {
      g.homework.sort((a, b) => {
        if (a.plan && b.plan) return a.plan.day - b.plan.day;
        return new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime();
      });
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [assignments, passages]);

  const handleDeleteHomework = useCallback(async (homeworkId: string) => {
    setDeletingId(homeworkId);
    try {
      await deleteHomework(homeworkId);
      setAssignments(prev => prev.filter(a => a.id !== homeworkId));
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }, []);

  const handleDeletePassage = useCallback(async (sentPassageId: string) => {
    setDeletingId(sentPassageId);
    try {
      await deletePassage(sentPassageId);
      setPassages(prev => prev.filter(p => p.id !== sentPassageId));
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
          <button
            onClick={() => router.push('/students')}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            All Students
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">
                {student?.name || 'Student'}
              </h1>
              <p className="text-sm text-stone-500">
                {totalItems === 0
                  ? 'No homework assigned to this student yet.'
                  : `${totalItems} passage${totalItems !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={() => setShowPlanModal(true)}
              className="flex-none flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1e1b4b] hover:bg-indigo-800 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <CalendarRange className="w-4 h-4" />
              <span className="hidden sm:inline">Practice Plan</span>
            </button>
          </div>
        </div>

        {totalItems === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-sm text-stone-400 font-medium mb-1">No homework yet</p>
            <p className="text-xs text-stone-300">Assign homework from the Learn page</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group, idx) => (
              <div
                key={group.passageId}
                className="animate-card-in"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Passage card (parent) — not clickable for teacher */}
                <div className="relative bg-white rounded-xl border border-stone-200/80 shadow-sm transition-all duration-200">
                  {/* Confirm delete overlay for passage */}
                  {confirmDelete?.type === 'passage' && confirmDelete.id === group.sentPassageId && (
                    <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center gap-3 animate-fade-in">
                      <p className="text-sm text-stone-600 font-medium">Delete this passage?</p>
                      <button
                        onClick={() => handleDeletePassage(group.sentPassageId!)}
                        disabled={deletingId === group.sentPassageId}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === group.sentPassageId ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="flex items-start">
                    <div className="flex-1 p-5 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-none">
                          <FileText className="w-4 h-4 text-teal-600" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 font-serif truncate">
                          {group.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-stone-400 ml-10.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(group.date)}
                        </span>
                        {group.type && (
                          <span className="text-stone-300">{group.type}</span>
                        )}
                      </div>
                    </div>

                    {/* Delete passage button (only if explicitly sent) */}
                    {group.sentPassageId && (
                      <button
                        onClick={() => setConfirmDelete({ id: group.sentPassageId!, type: 'passage' })}
                        className="flex-none p-5 text-stone-300 hover:text-red-500 transition-colors"
                        title="Delete passage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Homework cards (children) */}
                {group.homework.length > 0 && (
                  <div className="ml-4 sm:ml-6 mt-1 space-y-1">
                    {group.homework.map((hw) => {
                      const pStatus = hw.progressStatus || 'not_started';
                      const progress = progressConfig[pStatus];
                      const ProgressIcon = progress.icon;
                      const isConfirmingHw = confirmDelete?.type === 'homework' && confirmDelete.id === hw.id;

                      return (
                        <div
                          key={hw.id}
                          className="relative bg-white rounded-lg border border-stone-200/60 shadow-sm hover:shadow-md transition-all duration-200 group/hw"
                        >
                          {/* Confirm delete overlay for homework */}
                          {isConfirmingHw && (
                            <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center gap-3 animate-fade-in">
                              <p className="text-sm text-stone-600 font-medium">Delete this homework?</p>
                              <button
                                onClick={() => handleDeleteHomework(hw.id)}
                                disabled={deletingId === hw.id}
                                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {deletingId === hw.id ? 'Deleting...' : 'Delete'}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          <div className="flex items-center">
                            <div
                              onClick={() => router.push(`/students/${studentId}/homework/${hw.id}`)}
                              className="flex-1 px-4 py-3 min-w-0 cursor-pointer"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-none ${hw.homeworkType === 'comprehension' ? 'bg-teal-50' : 'bg-indigo-50'}`}>
                                    {hw.homeworkType === 'comprehension' ? (
                                      <Brain className="w-3.5 h-3.5 text-teal-600" />
                                    ) : (
                                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-slate-800">
                                        {hw.homeworkType === 'comprehension'
                                          ? 'Reading Comprehension'
                                          : hw.plan
                                          ? `Day ${hw.plan.day}`
                                          : 'Vocabulary Homework'}
                                      </span>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${progress.bg} ${progress.text} ${progress.border}`}>
                                        <ProgressIcon className={`w-2.5 h-2.5 ${progress.iconColor}`} />
                                        {progress.label}
                                        {hw.completionPercent != null && hw.completionPercent > 0 && pStatus !== 'completed' && (
                                          <span className="ml-0.5">{hw.completionPercent}%</span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-0.5">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {formatDate(hw.assignedAt)}
                                      </span>
                                      {hw.homeworkType === 'comprehension' ? (
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
                                      {(() => {
                                        const di = dueInfo(hw.dueDate, pStatus === 'completed');
                                        if (!di) return null;
                                        return (
                                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${DUE_TONE_CLASSES[di.tone]}`}>
                                            <CalendarClock className="w-2.5 h-2.5" />
                                            {di.label}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>

                                <ChevronRight className="w-4 h-4 text-stone-300 group-hover/hw:text-stone-500 group-hover/hw:translate-x-0.5 transition-all flex-none" />
                              </div>
                            </div>

                            {/* Delete homework button */}
                            <button
                              onClick={() => setConfirmDelete({ id: hw.id, type: 'homework' })}
                              className="flex-none px-3 py-3 text-stone-300 hover:text-red-500 transition-colors"
                              title="Delete homework"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {showPlanModal && (
        <PracticePlanModal
          studentId={studentId}
          studentName={student?.name || 'Student'}
          onClose={() => setShowPlanModal(false)}
          onCreated={reloadHomework}
        />
      )}
    </div>
  );
}
