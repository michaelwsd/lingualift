
import React from 'react';
import { VocabularyWord } from '../types';
import { Volume2 } from 'lucide-react';

interface VocabCardProps {
  word: VocabularyWord;
}

export const VocabCard: React.FC<VocabCardProps> = ({ word }) => {
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 transition-all hover:shadow-md hover:border-indigo-200 group relative">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900 capitalize font-serif leading-tight">{word.word}</h3>
          <button 
            onClick={handleSpeak}
            className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-indigo-50"
            aria-label="Pronounce"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <p className="text-sm text-slate-600 leading-snug mb-3">
        {word.definition}
      </p>

      <div className="pt-2 border-t border-slate-50">
         <p className="text-xs text-slate-500 italic bg-slate-50/50 p-2 rounded border border-slate-100/50 leading-relaxed">
           "{word.exampleSentence}"
         </p>
      </div>
    </div>
  );
};
