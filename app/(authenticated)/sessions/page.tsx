'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLinguaLift } from '@/contexts/LinguaLiftContext';
import { SavedSession } from '@/types';
import { FolderOpen, Trash2, BookOpen, Clock, Hash } from 'lucide-react';

const SESSIONS_KEY = 'lingualift-sessions';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [mounted, setMounted] = useState(false);
  const { loadSession } = useLinguaLift();
  const router = useRouter();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]') as SavedSession[];
    setSessions(stored);
    setMounted(true);
  }, []);

  const handleOpen = (session: SavedSession) => {
    loadSession(session);
    router.push('/learn');
  };

  const handleDelete = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  };

  if (!mounted) return null;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">Saved Sessions</h1>
          <p className="text-sm text-stone-400">Review your past learning sessions</p>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-7 h-7 text-stone-300" />
            </div>
            <h3 className="text-lg font-serif font-bold text-slate-700 mb-2">No saved sessions</h3>
            <p className="text-sm text-stone-400 max-w-xs mx-auto">
              Complete a learning session and click &quot;Save Session&quot; to save it here for review.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => (
              <div
                key={session.id}
                className="group relative bg-white rounded-xl border border-stone-200/80 shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <button
                  onClick={() => handleOpen(session)}
                  className="w-full text-left p-5 pr-14"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-none w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mt-0.5">
                      <BookOpen className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-serif font-bold text-slate-800 truncate mb-1">
                        {session.passage.title}
                      </h3>
                      <p className="text-xs text-stone-400 line-clamp-1 mb-2.5">
                        {session.passage.content.slice(0, 120)}...
                      </p>
                      <div className="flex items-center gap-4 text-[11px] text-stone-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.savedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {session.collectedWords.length} words
                        </span>
                        <span className="px-2 py-0.5 bg-stone-100 rounded-full text-stone-500">
                          {session.passage.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
