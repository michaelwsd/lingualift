'use client';

import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speak } from '@/lib/speak';

interface SpeakerButtonProps {
  text: string;
  /** Larger hero variant for stations where hearing the word is the main action. */
  size?: 'sm' | 'lg';
  label?: string;
}

export const SpeakerButton: React.FC<SpeakerButtonProps> = ({ text, size = 'sm', label }) => {
  const [pulsing, setPulsing] = useState(false);

  const handleClick = () => {
    speak(text);
    setPulsing(true);
    setTimeout(() => setPulsing(false), 400);
  };

  if (size === 'lg') {
    return (
      <button
        onClick={handleClick}
        className={`group inline-flex flex-col items-center gap-2 transition-transform ${pulsing ? 'animate-progress-pulse' : ''}`}
      >
        <span className="flex items-center justify-center w-20 h-20 rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/30 group-hover:bg-sky-600 group-active:scale-95 transition-all">
          <Volume2 className="w-9 h-9" />
        </span>
        {label && <span className="text-xs font-semibold text-stone-500">{label}</span>}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition-all ${pulsing ? 'animate-progress-pulse' : ''}`}
    >
      <Volume2 className="w-3.5 h-3.5" />
      {label || 'Hear it'}
    </button>
  );
};
