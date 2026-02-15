'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchHomeworkByStudent, fetchMyStudents, deleteHomework, HomeworkListItem, StudentItem } from '@/services/api';
import { ArrowLeft, Clock, BookOpen, ChevronRight, Loader2, GraduationCap, Trash2 } from 'lucide-react';

export default function StudentHomeworkListPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const [student, setStudent] = useState<StudentItem | null>(null);
  const [assignments, setAssignments] = useState<HomeworkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [students, hw] = await Promise.all([
          fetchMyStudents(),
          fetchHomeworkByStudent(studentId),
        ]);
        setStudent(students.find(s => s.id === studentId) || null);
        setAssignments(hw);
      } catch {
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const handleDelete = useCallback(async (homeworkId: string) => {
    setDeletingId(homeworkId);
    try {
      await deleteHomework(homeworkId);
      setAssignments(prev => prev.filter(a => a.id !== homeworkId));
    } catch {
      // Could show error toast, but for now just reset
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
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

  const statusConfig = {
    pending: { label: 'New', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    in_progress: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
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

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-10">
        <div className="mb-8 animate-fade-in">
          <button
            onClick={() => router.push('/students')}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            All Students
          </button>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">
            {student?.name || 'Student'}
          </h1>
          <p className="text-sm text-stone-500">
            {assignments.length === 0
              ? 'No homework assigned to this student yet.'
              : `${assignments.length} assignment${assignments.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-sm text-stone-400 font-medium mb-1">No homework yet</p>
            <p className="text-xs text-stone-300">Assign homework from the Learn page</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((hw, idx) => {
              const status = statusConfig[hw.status];
              const isConfirming = confirmDeleteId === hw.id;
              const isDeleting = deletingId === hw.id;

              return (
                <div
                  key={hw.id}
                  className="relative bg-white rounded-xl border border-stone-200/80 shadow-sm hover:shadow-md transition-all duration-200 animate-card-in group"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Confirm delete overlay */}
                  {isConfirming && (
                    <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center gap-3 animate-fade-in">
                      <p className="text-sm text-stone-600 font-medium">Delete this homework?</p>
                      <button
                        onClick={() => handleDelete(hw.id)}
                        disabled={isDeleting}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="flex items-start">
                    {/* Main clickable area */}
                    <button
                      onClick={() => router.push(`/students/${studentId}/homework/${hw.id}`)}
                      className="flex-1 text-left p-5 min-w-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <h3 className="text-base font-bold text-slate-900 font-serif truncate">
                              {hw.passageTitle}
                            </h3>
                            <span className={`flex-none px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${status.bg} ${status.text} ${status.border}`}>
                              {status.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-stone-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(hw.assignedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {hw.wordCount} words
                            </span>
                            {hw.passageType && (
                              <span className="text-stone-300">{hw.passageType}</span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all flex-none mt-1" />
                      </div>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => setConfirmDeleteId(hw.id)}
                      className="flex-none p-5 text-stone-300 hover:text-red-500 transition-colors"
                      title="Delete homework"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
