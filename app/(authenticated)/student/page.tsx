'use client';

import { GraduationCap } from 'lucide-react';

export default function StudentPage() {
  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-indigo-100 p-4 rounded-2xl">
            <GraduationCap className="w-10 h-10 text-indigo-900" />
          </div>
        </div>
        <h1 className="text-2xl font-serif font-bold text-slate-900 mb-3">Student Dashboard</h1>
        <p className="text-stone-500 text-sm leading-relaxed">
          Your learning experience is coming soon. Your teacher will share passages and exercises with you here.
        </p>
      </div>
    </div>
  );
}
