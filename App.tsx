
import React, { useState } from 'react';
import { GenerationConfig, Passage } from './types';
import { generatePassageContent } from './services/gemini';
import { GeneratorForm } from './components/GeneratorForm';
import { PassageViewer } from './components/PassageViewer';
import { Library } from 'lucide-react';

export default function App() {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = async (config: GenerationConfig) => {
    setIsGenerating(true);
    try {
      const result = await generatePassageContent(config);
      setPassage({
        ...result,
        id: crypto.randomUUID(),
        theme: config.theme === 'Custom Topic' ? config.customTopic || 'Custom' : config.theme,
        type: config.literatureType,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error(error);
      alert("Failed to generate passage. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-slate-900 font-sans selection:bg-indigo-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-900 p-2.5 rounded-lg shadow-md">
               <Library className="w-6 h-6 text-indigo-50" />
            </div>
            <div>
              <span className="block text-xl font-serif font-bold text-slate-900 leading-none">
                LinguaLift
              </span>
              <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">Academic Assistant</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 print:max-w-none print:px-0 print:py-0">
        
        {/* Generator View */}
        <div className="space-y-8 print:space-y-4">
          {!passage ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
              <div className="text-center mb-10 max-w-2xl">
                <h1 className="text-5xl font-serif font-bold text-slate-900 mb-6">Master English Contextually</h1>
                <p className="text-stone-600 text-lg leading-relaxed font-light">
                  Generate tailored academic reading passages. Enhance your lexicon with contextual definitions, reading comprehension, and interactive pronunciation guides.
                </p>
              </div>
              <GeneratorForm onGenerate={handleGenerate} isGenerating={isGenerating} />
            </div>
          ) : (
            <PassageViewer 
              passage={passage} 
              onReset={() => setPassage(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
