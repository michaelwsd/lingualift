import React, { useState } from 'react';
import { THEMES, LITERATURE_TYPES } from '../constants';
import { GenerationConfig, Theme, LiteratureType, Difficulty } from '../types';
import { Button } from './Button';
import { Sparkles, GraduationCap, Search, Gauge } from 'lucide-react';

interface GeneratorFormProps {
  onGenerate: (config: GenerationConfig) => void;
  isGenerating: boolean;
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ onGenerate, isGenerating }) => {
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(Theme.SCIENCE_TECH);
  const [customTopic, setCustomTopic] = useState('');
  const [literatureType, setLiteratureType] = useState<LiteratureType>(LiteratureType.NEWS_ARTICLE);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTheme = selectedTheme || Theme.CUSTOM;
    onGenerate({ theme: finalTheme, customTopic, literatureType, difficulty });
  };

  const handleThemeSelect = (t: Theme) => {
    setSelectedTheme(t);
    setCustomTopic(''); // Clear custom input when a preset is chosen
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTopic(e.target.value);
    setSelectedTheme(null); // Deselect preset when typing custom
  };

  // Filter out 'Custom Topic' from the preset list since we have a dedicated input
  const presetThemes = THEMES.filter(t => t !== Theme.CUSTOM);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-sm shadow-xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#1e1b4b] p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
              <GraduationCap className="w-8 h-8 text-indigo-100" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-white mb-2">Curriculum Generator</h2>
            <p className="text-indigo-200 font-light tracking-wide text-sm uppercase">Create personalized academic content</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-10 bg-[#fdfbf7]">
          
          {/* Section 1: Subject Matter */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-stone-200 pb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-200 text-stone-600 text-xs font-bold">1</span>
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Subject Matter</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presetThemes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleThemeSelect(t)}
                  className={`
                    relative flex items-center p-4 cursor-pointer rounded-lg border text-left transition-all duration-200
                    ${selectedTheme === t 
                      ? 'border-indigo-900 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-900 z-10' 
                      : 'border-stone-200 bg-white hover:border-indigo-300 hover:bg-stone-50'}
                  `}
                >
                  <span className={`font-serif text-sm font-medium ${selectedTheme === t ? 'text-indigo-900' : 'text-stone-600'}`}>
                    {t}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Topic Input */}
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search className={`h-4 w-4 ${customTopic ? 'text-indigo-600' : 'text-stone-400'}`} />
               </div>
               <input
                 type="text"
                 value={customTopic}
                 onChange={handleCustomInputChange}
                 placeholder="Or type a specific topic (e.g., 'Quantum Physics', 'The Gold Rush')..."
                 className={`
                   w-full pl-10 pr-4 py-3 bg-white border rounded-lg outline-none font-serif text-slate-800 placeholder:text-stone-400 placeholder:italic transition-all
                   ${customTopic 
                     ? 'border-indigo-900 ring-1 ring-indigo-900 shadow-sm' 
                     : 'border-stone-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}
                 `}
               />
               {customTopic && (
                 <span className="absolute right-3 top-3 text-[10px] font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                   Custom Selected
                 </span>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Section 2: Format */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-stone-200 pb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-200 text-stone-600 text-xs font-bold">2</span>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Format</h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                 {LITERATURE_TYPES.map((type) => (
                   <label 
                     key={type}
                     className={`
                       cursor-pointer text-center px-2 py-3 rounded-md border transition-all text-xs font-medium select-none flex items-center justify-center
                       ${literatureType === type 
                         ? 'bg-indigo-900 text-white border-indigo-900 shadow-md' 
                         : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:bg-stone-50'}
                     `}
                   >
                     <input
                       type="radio"
                       name="literatureType"
                       value={type}
                       checked={literatureType === type}
                       onChange={() => setLiteratureType(type as LiteratureType)}
                       className="sr-only"
                     />
                     {type}
                   </label>
                 ))}
              </div>
            </div>

            {/* Section 3: Difficulty */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-stone-200 pb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-200 text-stone-600 text-xs font-bold">3</span>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Difficulty</h3>
              </div>
              
              <div className="bg-white p-1 rounded-lg border border-stone-200 flex">
                <button
                  type="button"
                  onClick={() => setDifficulty(Difficulty.EASY)}
                  className={`flex-1 py-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    difficulty === Difficulty.EASY 
                      ? 'bg-teal-600 text-white shadow-sm' 
                      : 'text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <Gauge className="w-4 h-4" />
                  Easy (~200w)
                </button>
                <button
                  type="button"
                  onClick={() => setDifficulty(Difficulty.MEDIUM)}
                  className={`flex-1 py-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    difficulty === Difficulty.MEDIUM 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <Gauge className="w-4 h-4" />
                  Medium (~500w)
                </button>
              </div>
              <p className="text-xs text-stone-500 italic px-1">
                {difficulty === Difficulty.EASY 
                  ? 'Simpler vocabulary and shorter sentences. Good for quick practice.' 
                  : 'Standard academic length and complexity. Best for deep learning.'}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full py-4 text-lg bg-indigo-900 hover:bg-indigo-800 text-white font-serif tracking-wide shadow-xl hover:shadow-2xl transition-all" 
              isLoading={isGenerating}
            >
              {!isGenerating && <Sparkles className="w-5 h-5 mr-3 text-indigo-300" />}
              {isGenerating ? 'Composing...' : 'Generate Learning Material'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};