
import React from 'react';
import { VocabularyWord } from '../types';
import { Volume2 } from 'lucide-react';

interface VocabHighlightProps {
  word: VocabularyWord;
  children: React.ReactNode;
}

export const VocabHighlight: React.FC<VocabHighlightProps> = ({ word, children }) => {
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <span 
      className="relative group inline-block cursor-help align-baseline"
      onClick={(e) => e.stopPropagation()} 
    >
      {/* The Highlighted Text - Purely visual underline, no anchor tag */}
      <span className="underline decoration-2 underline-offset-4 decoration-indigo-300 text-slate-900 transition-all duration-300 group-hover:decoration-indigo-600 group-hover:text-indigo-900 decoration-clone">
        {children}
      </span>

      {/* Tooltip */}
      <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 ease-out translate-y-2 group-hover:translate-y-0 pointer-events-none">
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-700 text-left relative">
          
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900"></div>

          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="font-bold text-lg capitalize text-indigo-200 font-serif">{word.word}</h4>
            <button 
              onClick={handleSpeak}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-indigo-200 hover:text-white shrink-0 pointer-events-auto cursor-pointer"
              title="Pronounce"
              aria-label="Pronounce word"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-slate-300 leading-relaxed font-sans border-t border-slate-700/50 pt-2 mt-1">
            {word.definition}
          </p>
        </div>
      </div>
    </span>
  );
};
