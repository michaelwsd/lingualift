
import React, { useState } from 'react';
import { GenerationConfig, Passage, SavedWord } from './types';
import { generatePassageContent } from './services/gemini';
import { GeneratorForm } from './components/GeneratorForm';
import { PassageViewer } from './components/PassageViewer';
import { CollectionView } from './components/CollectionView';
import { Library, BookMarked } from 'lucide-react';

export default function App() {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [collection, setCollection] = useState<SavedWord[]>([]);
  const [currentView, setCurrentView] = useState<'generator' | 'passage' | 'collection'>('generator');
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
      setCurrentView('passage');
    } catch (error) {
      console.error(error);
      alert("Failed to generate passage. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToCollection = (item: SavedWord) => {
    setCollection(prev => [item, ...prev]);
  };

  const handleRemoveFromCollection = (id: string) => {
    setCollection(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-stone-100 text-slate-900 font-sans selection:bg-indigo-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-4">
          <button 
            onClick={() => setCurrentView(passage ? 'passage' : 'generator')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="bg-indigo-900 p-2.5 rounded-lg shadow-md">
               <Library className="w-6 h-6 text-indigo-50" />
            </div>
            <div className="text-left">
              <span className="block text-xl font-serif font-bold text-slate-900 leading-none">
                LinguaLift
              </span>
              <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">VCE Assistant</span>
            </div>
          </button>

          <button 
            onClick={() => setCurrentView('collection')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${currentView === 'collection' ? 'bg-indigo-50 text-indigo-900' : 'text-slate-600 hover:bg-stone-50'}`}
          >
            <BookMarked className="w-5 h-5" />
            <span>Collection</span>
            {collection.length > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {collection.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 print:max-w-none print:px-0 print:py-0">
        
        {/* View Switcher */}
        <div className="space-y-8 print:space-y-4">
          {currentView === 'collection' ? (
             <CollectionView 
               collection={collection} 
               onBack={() => setCurrentView(passage ? 'passage' : 'generator')}
               onRemove={handleRemoveFromCollection}
             />
          ) : !passage ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
              <div className="text-center mb-10 max-w-2xl">
                <h1 className="text-5xl font-serif font-bold text-slate-900 mb-6">Master VCE English</h1>
                <p className="text-stone-600 text-lg leading-relaxed font-light">
                  Generate tailored academic reading passages based on VCE Units 1-4. Enhance your lexicon with contextual definitions, reading comprehension, and interactive pronunciation guides.
                </p>
              </div>
              <GeneratorForm onGenerate={handleGenerate} isGenerating={isGenerating} />
            </div>
          ) : (
            <PassageViewer 
              passage={passage} 
              onReset={() => {
                setPassage(null);
                setCurrentView('generator');
              }}
              onAddToCollection={handleAddToCollection}
            />
          )}
        </div>
      </main>
    </div>
  );
}
