
import React, { useMemo, useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Passage, VocabularyWord, Question } from '../types';
import { VocabCard } from './VocabCard';
import { BookOpen, RefreshCw, X, Loader2, HelpCircle, ChevronDown, Download, CheckCircle2, Lightbulb, PenTool, FileText, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { VocabHighlight } from './VocabHighlight';
import { getWordDefinition } from '../services/gemini';

interface PassageViewerProps {
  passage: Passage;
  onReset: () => void;
}

interface DefinitionState {
  word: string;
  definition: string | null;
  isLoading: boolean;
  position: { x: number, y: number } | null;
}

const QuestionItem: React.FC<{ question: Question; index: number }> = ({ question, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="question-container border border-stone-200 rounded-lg bg-white overflow-hidden transition-all hover:shadow-md print:border-stone-300 print:break-inside-avoid group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start text-left p-5 gap-4 hover:bg-stone-50 transition-colors print:hidden outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/50"
      >
        <span className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold transition-all duration-300 ${isOpen ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100'}`}>
          {index + 1}
        </span>
        <div className="flex-grow pt-0.5">
          <h4 className={`text-base font-medium leading-relaxed transition-colors ${isOpen ? 'text-indigo-900' : 'text-slate-800'}`}>
            {question.question}
          </h4>
        </div>
        <div className={`flex-shrink-0 text-slate-400 pt-1 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`}>
           <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      
      {/* Print View: Always show questions expanded */}
      <div className="hidden print:flex p-4 gap-4 items-start">
         <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 text-stone-900 border border-stone-300 text-xs font-bold">
          {index + 1}
        </span>
        <h4 className="text-sm font-medium text-slate-900 leading-relaxed">{question.question}</h4>
      </div>

      {/* Answer Key Wrapper */}
      <div className={`answer-key ${isOpen ? 'block' : 'hidden'} print:block px-5 pb-6 pt-2 animate-in slide-in-from-top-1 duration-200`}>
        {/* Answer Box - Centered */}
        <div className="mx-auto max-w-2xl p-6 bg-stone-50/80 rounded-xl border border-stone-100 text-sm print:border-none print:bg-transparent print:p-0 space-y-5">
          
          {/* Answer Section */}
          <div className="group/answer">
             <div className="flex items-center gap-2 mb-2 text-emerald-700 font-bold text-xs uppercase tracking-wider print:text-black">
               <CheckCircle2 className="w-4 h-4" />
               Correct Answer
             </div>
             <div className="pl-3 border-l-2 border-emerald-200 print:border-0 print:pl-0">
               <p className="text-slate-900 font-medium leading-relaxed">
                 {question.answer}
               </p>
             </div>
          </div>

          {/* Explanation Section */}
          <div className="group/explanation">
             <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold text-xs uppercase tracking-wider print:text-black">
               <Lightbulb className="w-4 h-4" />
               Explanation
             </div>
             <div className="pl-3 border-l-2 border-indigo-200 print:border-0 print:pl-0">
               <p className="text-slate-600 leading-relaxed italic print:text-black print:not-italic">
                 {question.explanation}
               </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export const PassageViewer: React.FC<PassageViewerProps> = ({ 
  passage, 
  onReset
}) => {
  const [activeDef, setActiveDef] = useState<DefinitionState>({ word: '', definition: null, isLoading: false, position: null });
  const [printMode, setPrintMode] = useState<'student' | 'teacher'>('teacher');
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
         const target = e.target as HTMLElement;
         if (!target.classList.contains('clickable-word')) {
           setActiveDef(prev => ({ ...prev, position: null }));
         }
      }
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) {
        setIsDownloadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWordClick = async (word: string, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    setActiveDef({
      word,
      definition: null,
      isLoading: true,
      position: { x, y }
    });

    const def = await getWordDefinition(word);
    
    setActiveDef(prev => {
        if (prev.word === word) {
            return { ...prev, definition: def, isLoading: false };
        }
        return prev;
    });
  };

  const handlePrint = (mode: 'student' | 'teacher') => {
    setPrintMode(mode);
    setIsDownloadOpen(false);
    // Allow state to update and render correct classes before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const processedContent = useMemo(() => {
    let content = passage.content;
    const sortedVocab = [...passage.vocabulary].sort((a, b) => b.word.length - a.word.length);
    sortedVocab.forEach(word => {
      const escapedWord = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b(${escapedWord})\\b`, 'gi');
      content = content.replace(regex, `[$1](vocab:${word.id})`);
    });
    return content;
  }, [passage.content, passage.vocabulary]);

  const ParagraphRenderer = ({ children }: { children: React.ReactNode }) => {
    return (
      <p className="mb-6 leading-8">
        {React.Children.map(children, (child) => {
          if (typeof child === 'string') {
             const parts = child.split(/(\s+)/);
             return parts.map((part, i) => {
               if (part.match(/^\s+$/)) return part;
               const cleanWord = part.replace(/^[^\w]+|[^\w]+$/g, '');
               if (!cleanWord) return part;

               return (
                 <span 
                   key={i}
                   className="clickable-word hover:bg-yellow-100 hover:text-yellow-900 cursor-pointer rounded transition-colors print:hover:bg-transparent print:hover:text-inherit print:cursor-text"
                   onClick={(e) => handleWordClick(cleanWord, e)}
                 >
                   {part}
                 </span>
               );
             });
          }
          return child;
        })}
      </p>
    );
  };

  return (
    <div className={`animate-in fade-in duration-500 relative ${printMode === 'student' ? 'print-student-view' : ''}`}>
      
      {/* Control Bar (Hidden in Print) */}
      <div className="flex justify-end mb-4 print:hidden relative" ref={downloadRef}>
        <Button 
          onClick={() => setIsDownloadOpen(!isDownloadOpen)} 
          variant="secondary" 
          className="gap-2 shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export PDF
          <ChevronDown className={`w-3 h-3 transition-transform ${isDownloadOpen ? 'rotate-180' : ''}`} />
        </Button>
        
        {isDownloadOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-20 animate-in slide-in-from-top-2">
            <button 
              onClick={() => handlePrint('student')}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-center justify-between group"
            >
              <span>Student Version <span className="text-xs text-slate-400 block font-normal mt-0.5">Without answers</span></span>
              <FileText className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
            </button>
            <button 
              onClick={() => handlePrint('teacher')}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between group"
            >
              <span>Teacher Version <span className="text-xs text-slate-400 block font-normal mt-0.5">With complete key</span></span>
              <CheckCircle2 className="w-4 h-4 text-slate-300 group-hover:text-teal-600" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 print:block">
        
        {/* Definition Popover (Hidden in Print) */}
        {activeDef.position && (
          <div 
            className="fixed z-50 transform -translate-x-1/2 -translate-y-full mb-2 w-64 animate-in fade-in zoom-in-95 duration-200 print:hidden"
            style={{ left: activeDef.position.x, top: activeDef.position.y - 10 }}
            ref={containerRef}
          >
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 relative">
              <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-r border-b border-slate-700 transform rotate-45"></div>
              
              <div className="flex justify-between items-start gap-2 mb-2">
                 <h4 className="font-bold text-lg capitalize text-yellow-400">{activeDef.word}</h4>
                 <button onClick={() => setActiveDef(prev => ({ ...prev, position: null }))} className="text-slate-400 hover:text-white">
                   <X className="w-4 h-4" />
                 </button>
              </div>
              
              {activeDef.isLoading ? (
                 <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                   <Loader2 className="w-4 h-4 animate-spin" /> Looking up...
                 </div>
              ) : (
                 <p className="text-sm text-slate-200 leading-relaxed">
                   {activeDef.definition}
                 </p>
              )}
            </div>
          </div>
        )}

        {/* Main Passage Column */}
        <div className="xl:col-span-8 space-y-8 print:w-full print:mb-8">
          <div className="bg-[#fdfbf7] rounded-sm shadow-sm border border-stone-200 p-8 lg:p-16 relative overflow-hidden min-h-[600px] print:min-h-0 print:shadow-none print:border print:border-stone-300 print:break-after-page">
             <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-900/10 print:hidden"></div>
             <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-900/10 print:hidden"></div>
             
             <header className="mb-10 text-center border-b-2 border-double border-stone-200 pb-8 print:pb-4 print:mb-6">
                <div className="flex items-center justify-center gap-2 text-indigo-800 text-xs font-bold uppercase tracking-widest mb-4 print:text-black">
                  <BookOpen className="w-3 h-3" />
                  {passage.theme} — {passage.type}
                </div>
                <h1 className="text-4xl lg:text-5xl font-serif font-bold text-slate-900 leading-tight mb-4 print:text-black print:text-3xl">
                  {passage.title}
                </h1>
                <div className="text-slate-500 font-serif italic text-sm print:text-black">
                  Generated for High School English (CEFR B2/C1)
                </div>
             </header>

             <article className="prose prose-slate prose-lg max-w-none font-serif text-slate-800 selection:bg-indigo-100 selection:text-indigo-900 print:text-black print:text-base">
               <ReactMarkdown
                 components={{
                   a: ({ href, children }) => {
                     // Check if it's a vocab link
                     if (href?.startsWith('vocab:')) {
                       const id = href.split(':')[1];
                       const word = passage.vocabulary.find(v => v.id === id);
                       if (word) {
                         // Renders span, not an anchor
                         return <VocabHighlight word={word}>{children}</VocabHighlight>;
                       }
                     }
                     // Fallback for actual links
                     return <a href={href} className="text-indigo-600 underline print:text-black print:no-underline">{children}</a>;
                   },
                   p: ParagraphRenderer
                 }}
               >
                 {processedContent}
               </ReactMarkdown>
             </article>
          </div>

          {/* Reading Comprehension Section */}
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8 print:shadow-none print:border-t-2 print:border-stone-300 print:border-x-0 print:border-b-0 print:px-0">
            <div className="flex items-center gap-2 mb-6 border-b border-stone-100 pb-4 print:border-stone-300">
              <div className="p-2 bg-indigo-50 rounded-lg print:hidden">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-serif font-bold text-slate-900 print:text-2xl print:text-black">Reading Comprehension</h2>
            </div>
            
            <div className="space-y-4 print:space-y-6">
              {passage.questions.map((q, idx) => (
                <QuestionItem key={q.id} question={q} index={idx} />
              ))}
            </div>
          </div>

          {/* Writing Workshop Section */}
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8 print:shadow-none print:border-t-2 print:border-stone-300 print:border-x-0 print:border-b-0 print:px-0 print:break-inside-avoid">
             <div className="flex items-center gap-2 mb-6 border-b border-stone-100 pb-4 print:border-stone-300">
               <div className="p-2 bg-indigo-50 rounded-lg print:hidden">
                 <PenTool className="w-5 h-5 text-indigo-600" />
               </div>
               <h2 className="text-xl font-serif font-bold text-slate-900 print:text-2xl print:text-black">Writing Workshop</h2>
             </div>

             <div className="space-y-6">
                <div className="bg-stone-50 p-6 rounded-lg border border-stone-100 print:bg-transparent print:border-stone-300 print:p-4">
                  <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-3 print:text-black">Writing Prompt</h3>
                  <p className="text-lg text-slate-800 font-serif leading-relaxed italic print:text-black">
                    "{passage.writingPrompt}"
                  </p>
                </div>

                <div className="sample-response print:mt-6">
                  <details className="group print:open:block">
                    <summary className="list-none flex items-center gap-2 text-sm font-medium text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors print:hidden">
                      <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                      View Sample Band 6 Response
                    </summary>
                    <div className="mt-4 pl-4 border-l-2 border-indigo-100 animate-in slide-in-from-top-2 print:mt-0 print:border-l-0 print:pl-0 print:block">
                       <h3 className="hidden print:block text-sm font-bold text-black uppercase tracking-widest mb-2 mt-4">Sample Response</h3>
                       <p className="text-slate-600 leading-relaxed font-serif whitespace-pre-wrap print:text-black">
                         {passage.sampleResponse}
                       </p>
                    </div>
                  </details>
                </div>
             </div>
          </div>
          
          <div className="flex justify-center pt-4 print:hidden">
            <Button variant="outline" onClick={onReset} className="gap-2 bg-white hover:bg-slate-50 border-slate-300">
              <RefreshCw className="w-4 h-4" />
              Generate New Topic
            </Button>
          </div>
        </div>

        {/* Vocabulary Column */}
        <div className="xl:col-span-4 space-y-6 print:w-full print:block print:break-before-page">
          <div className="sticky top-6 print:static">
            <div className="flex items-center justify-between mb-4 print:mb-6">
              <h2 className="text-xl font-bold text-slate-900 font-serif print:text-2xl">
                Key Vocabulary
              </h2>
              <span className="bg-stone-200 text-stone-700 text-xs font-bold px-2 py-1 rounded-md print:border print:border-stone-400 print:bg-transparent">
                {passage.vocabulary.length} Words
              </span>
            </div>
            
            {/* Print Layout: Grid for vocab cards instead of scrollable list */}
            <div className="space-y-3 max-h-[calc(100vh-100px)] overflow-y-auto pr-2 pb-10 custom-scrollbar print:max-h-none print:overflow-visible print:space-y-0 print:grid print:grid-cols-2 print:gap-4 print:pb-0">
              {passage.vocabulary.map((word) => (
                <VocabCard 
                  key={word.id} 
                  word={word} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
