'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchStudents, StudentItem } from '@/services/api';
import { Users, ChevronRight, Loader2 } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStudents()
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-400">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Students</h1>
          <p className="text-sm text-stone-500">
            {students.length === 0
              ? 'No students registered yet.'
              : `${students.length} student${students.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-sm text-stone-400 font-medium mb-1">No students yet</p>
            <p className="text-xs text-stone-300">Students will appear here once they register</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student, idx) => (
              <button
                key={student.id}
                onClick={() => router.push(`/students/${student.id}`)}
                className="w-full text-left bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 animate-card-in group"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-indigo-700">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">{student.name}</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all flex-none" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
