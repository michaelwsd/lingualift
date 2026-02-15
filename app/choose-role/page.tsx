'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Library, GraduationCap, BookOpen, Lock, ArrowRight } from 'lucide-react';

export default function ChooseRolePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [storedPassword, setStoredPassword] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const role = (user.publicMetadata as { role?: string }).role;
    if (role === 'student') {
      router.replace('/student');
    } else if (role === 'teacher') {
      router.replace('/generate');
    } else {
      setChecking(false);
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    fetch('/api/admin-password')
      .then(res => res.json())
      .then(data => setStoredPassword(data.password))
      .catch(() => setStoredPassword('admin1234'));
  }, []);

  const handleContinue = async () => {
    if (!user || !selectedRole || submitting) return;

    if (selectedRole === 'teacher') {
      if (adminPassword !== storedPassword) {
        setError('Incorrect admin password');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!res.ok) throw new Error('Failed to set role');

      router.push(selectedRole === 'student' ? '/student' : '/generate');
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen bg-linear-to-br from-stone-100 via-indigo-50/30 to-stone-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-stone-100 via-indigo-50/30 to-stone-100 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-indigo-900 p-3 rounded-xl shadow-lg">
            <Library className="w-7 h-7 text-indigo-100" />
          </div>
        </div>
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Welcome to LinguaLift</h1>
        <p className="text-stone-500 text-sm font-light tracking-wide">Choose how you&apos;d like to continue</p>
      </div>

      <div className="w-full max-w-lg space-y-4">
        {/* Student Card */}
        <button
          onClick={() => { setSelectedRole('student'); setError(''); }}
          className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
            selectedRole === 'student'
              ? 'border-indigo-500 bg-indigo-50/80 shadow-md'
              : 'border-stone-200/60 bg-white/80 hover:border-stone-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${selectedRole === 'student' ? 'bg-indigo-900' : 'bg-stone-100'}`}>
              <GraduationCap className={`w-6 h-6 ${selectedRole === 'student' ? 'text-indigo-100' : 'text-stone-500'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Student</h3>
              <p className="text-sm text-stone-500">Access learning materials and practice exercises</p>
            </div>
          </div>
        </button>

        {/* Teacher Card */}
        <button
          onClick={() => { setSelectedRole('teacher'); setError(''); }}
          className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
            selectedRole === 'teacher'
              ? 'border-indigo-500 bg-indigo-50/80 shadow-md'
              : 'border-stone-200/60 bg-white/80 hover:border-stone-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${selectedRole === 'teacher' ? 'bg-indigo-900' : 'bg-stone-100'}`}>
              <BookOpen className={`w-6 h-6 ${selectedRole === 'teacher' ? 'text-indigo-100' : 'text-stone-500'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Teacher</h3>
              <p className="text-sm text-stone-500">Generate passages, manage sessions, and configure content</p>
            </div>
          </div>
        </button>

        {/* Admin password input for teacher */}
        {selectedRole === 'teacher' && (
          <div className="bg-white/80 border border-stone-200/60 rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Admin password required</span>
            </div>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => { setAdminPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleContinue(); }}
              placeholder="Enter admin password"
              className="w-full px-4 py-2.5 border border-stone-300 rounded-lg bg-stone-50/50 text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 font-medium text-center">{error}</p>
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!selectedRole || (selectedRole === 'teacher' && (!adminPassword || storedPassword === null)) || submitting}
          className="w-full py-3 bg-indigo-900 hover:bg-indigo-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
