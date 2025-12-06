
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { SavedWord } from '../types';
import { Download, Trash2, ArrowLeft, BookMarked, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { generateCollectionPassage } from '../services/gemini';

interface CollectionViewProps {
  collection: SavedWord[];
  onBack: () => void;
  onRemove: (id: string) => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({ collection, onBack, onRemove }) => {
  const [collectionPassage, setCollectionPassage] = useState<string | null>(null);
  const [isGeneratingPassage, setIsGeneratingPassage] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePassage = async () => {
    if (collection.length === 0) return;
    setIsGeneratingPassage(true);
    try {
      const words = collection.map(item => item.text);
      const passage = await generateCollectionPassage(words);
      setCollectionPassage(passage);
    } catch (error) {
      console.error("Failed to generate collection passage", error);
    } finally {
      setIsGeneratingPassage(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header - Hidden on Print */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Passage
          </Button>
          <h2 className="text-2xl font-serif font-bold text-slate-900">My Collection</h2>
        </div>
        
        <div className="flex gap-3">
            {collection.length > 0 && (
                <Button 
                    onClick={handleGeneratePassage} 
                    variant="primary" 
                    className="gap-2"
                    isLoading={isGeneratingPassage}
                >
                    <Sparkles className="w-4 h-4" />
                    Generate Practice Passage
                </Button>
            )}
            {collection.length > 0 && (
            <Button onClick={handlePrint} variant="secondary" className="gap-2">
                <Download className="w-4 h-4" />
                Export to PDF
            </Button>
            )}
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-10 border-b-2 border-stone-200 pb-4">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">My Vocabulary Collection</h1>
        <p className="text-stone-500">LinguaLift VCE Resources</p>
      </div>

      {collection.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-dashed border-stone-300">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookMarked className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">Your collection is empty</h3>
          <p className="text-stone-500 max-w-sm mx-auto">
            Select words or phrases in the reading passage to add them to your collection.
          </p>
          <Button variant="primary" onClick={onBack} className="mt-6">
            Go to Passage
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
            {/* Generated Passage Display */}
            {collectionPassage && (
                <div className="bg-[#fdfbf7] rounded-xl border border-stone-200 p-8 print:border-stone-300 print:break-inside-avoid">
                    <h3 className="text-xl font-serif font-bold text-indigo-900 mb-4 print:text-black">Practice Passage</h3>
                    <div className="prose prose-stone prose-lg max-w-none text-slate-800 font-serif leading-relaxed print:text-black print:text-base">
                        <ReactMarkdown>{collectionPassage}</ReactMarkdown>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-8">
            {collection.map((item) => (
                <div 
                key={item.id} 
                className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col print:border-stone-300 print:shadow-none print:break-inside-avoid"
                >
                <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-serif font-bold text-indigo-900 mb-1 capitalize">
                        {item.text}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100 print:bg-transparent print:border-stone-300 print:text-stone-600">
                        Synonym: {item.synonym}
                        </span>
                    </div>
                    </div>

                    <div className="space-y-4">
                    <div>
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Definition</h4>
                        <p className="text-slate-700 leading-relaxed text-sm">
                        {item.definition}
                        </p>
                    </div>
                    
                    {item.exampleSentence && (
                        <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 print:bg-transparent print:border-l-2 print:border-stone-300 print:border-y-0 print:border-r-0 print:rounded-none">
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Example</h4>
                        <p className="text-slate-600 italic text-xs leading-relaxed">
                            "{item.exampleSentence}"
                        </p>
                        </div>
                    )}
                    </div>
                </div>

                {/* Footer Actions - Hidden on Print */}
                <div className="bg-stone-50 p-3 flex justify-end border-t border-stone-100 print:hidden">
                    <button 
                    onClick={() => onRemove(item.id)}
                    className="text-stone-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                    title="Remove from collection"
                    >
                    <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                </div>
            ))}
            </div>
        </div>
      )}
    </div>
  );
};
