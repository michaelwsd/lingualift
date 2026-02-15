'use client';

import { LinguaLiftProvider } from '@/contexts/LinguaLiftContext';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { Library, FolderOpen, BookOpen, GraduationCap, Users } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import { getUserRole } from '@/lib/getUserRole';
import { useEffect } from 'react';

function NavHeader() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const role = getUserRole(user);
  const isStudent = role === 'student';

  const logoHref = isStudent ? '/student/homework' : '/generate';

  return (
    <header className="flex-none z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200/60">
      <div className="max-w-360 mx-auto px-6 lg:px-8 flex items-center justify-between h-14">
        <Link
          href={logoHref}
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
          {isStudent ? (
            <>
              <Link
                href="/student/vocabulary"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  pathname === '/student/vocabulary'
                    ? 'text-slate-900'
                    : 'text-stone-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Vocabulary
              </Link>
              <Link
                href="/student/homework"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith('/student/homework')
                    ? 'text-slate-900'
                    : 'text-stone-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Homework
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/sessions"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  pathname === '/sessions'
                    ? 'text-slate-900'
                    : 'text-stone-500 hover:text-slate-800'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                Sessions
              </Link>
              <Link
                href="/students"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith('/students')
                    ? 'text-slate-900'
                    : 'text-stone-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                Students
              </Link>
            </>
          )}
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}

const TEACHER_ROUTES = ['/generate', '/learn', '/sessions', '/students'];
const STUDENT_ROUTES = ['/student'];

function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const role = getUserRole(user);

  useEffect(() => {
    if (!isLoaded || !role) return;

    if (role === 'student') {
      const isTeacherRoute = TEACHER_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
      if (isTeacherRoute) {
        router.replace('/student/homework');
      }
    } else if (role === 'teacher') {
      const isStudentRoute = STUDENT_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
      if (isStudentRoute) {
        router.replace('/generate');
      }
    }
  }, [isLoaded, role, pathname, router]);

  if (!isLoaded) return null;

  // Don't render content for unauthorized routes while redirecting
  if (role === 'student') {
    const isTeacherRoute = TEACHER_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
    if (isTeacherRoute) return null;
  } else if (role === 'teacher') {
    const isStudentRoute = STUDENT_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
    if (isStudentRoute) return null;
  }

  return <>{children}</>;
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <LinguaLiftProvider>
      <div className="h-screen flex flex-col bg-[#f8f6f1] text-slate-900 font-sans selection:bg-indigo-200">
        <NavHeader />
        <main className="flex-1 overflow-hidden">
          <RouteGuard>{children}</RouteGuard>
        </main>
      </div>
    </LinguaLiftProvider>
  );
}
