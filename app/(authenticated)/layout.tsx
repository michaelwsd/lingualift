'use client';

import { LinguaLiftProvider } from '@/contexts/LinguaLiftContext';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { Library, FolderOpen } from 'lucide-react';
import Link from 'next/link';

function NavHeader() {
  return (
    <header className="flex-none z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200/60">
      <div className="max-w-360 mx-auto px-6 lg:px-8 flex items-center justify-between h-14">
        <Link
          href="/generate"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="bg-[#1e1b4b] p-2 rounded-lg shadow-sm">
            <Library className="w-5 h-5 text-indigo-100" />
          </div>
          <div className="text-left">
            <span className="block text-lg font-serif font-bold text-slate-900 leading-none">
              LinguaLift
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">VCE EAL</span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/sessions"
            className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-slate-800 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            Sessions
          </Link>
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <LinguaLiftProvider>
      <div className="h-screen flex flex-col bg-[#f8f6f1] text-slate-900 font-sans selection:bg-indigo-200">
        <NavHeader />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </LinguaLiftProvider>
  );
}
