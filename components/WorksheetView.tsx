
import React, { useState } from 'react';
import { Passage, WorksheetData, SavedWord } from '../types';
import { Button } from './Button';
import { ArrowLeft, Printer, Eye, EyeOff, Video, Youtube, FileText, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface WorksheetViewProps {
  passage: Passage;
  worksheetData: WorksheetData;
  collection: SavedWord[];
  onBack: () => void;
}

export const WorksheetView: React.FC<WorksheetViewProps> = ({ passage, worksheetData, collection, onBack }) => {
  const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');

  const handlePrint = () => {
    window.print();
  };

  const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-2 mb-6 border-b-2 border-stone-200 pb-2 print:border-black">
      <div className="p-2 bg-indigo-50 rounded-lg print:hidden">
        <Icon className="w-5 h-5 text-indigo-900" />
      </div>
      <h2 className="text-xl font-serif font-bold text-slate-900 uppercase tracking-wide print:text-black">
        {title}
      </h2>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      {/* Control Bar - Hidden on Print */}
      <div className="sticky top-20 z-40 bg-white/95 backdrop-blur border border-slate-200 shadow-lg rounded-xl p-4 mb-8 flex flex-wrap gap-4 items-center justify-between print:hidden max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-300"></div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('student')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'student' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Student View
            </button>
            <button
              onClick={() => setViewMode('teacher')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'teacher' ? 'bg-indigo-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Teacher Key
            </button>
          </div>
        </div>
        <Button onClick={handlePrint} variant="primary" className="gap-2">
          <Printer className="w-4 h-4" />
          Print Worksheet
        </Button>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-16 shadow-sm min-h-screen print:shadow-none print:p-0 print:max-w-none">
        
        {/* Header */}
        <header className="text-center mb-12 border-b-2 border-double border-slate-900 pb-8">
          <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2 uppercase tracking-tight print:text-black">
            {passage.title}
          </h1>
          <div className="flex justify-center gap-6 text-sm font-medium text-slate-600 print:text-black">
            <span>Theme: {passage.theme}</span>
            <span>•</span>
            <span>Level: VCE English</span>
            <span>•</span>
            <span>{viewMode === 'teacher' ? 'TEACHER ANSWER KEY' : 'STUDENT WORKSHEET'}</span>
          </div>
        </header>

        {/* Part 1: Reading Passage & Comprehension */}
        <section className="mb-12 print:break-inside-avoid">
          <SectionHeader title="Part 1: Reading Comprehension" icon={FileText} />
          
          <div className="prose prose-slate max-w-none font-serif text-justify mb-8 text-sm leading-relaxed print:text-black">
             <ReactMarkdown>{passage.content}</ReactMarkdown>
          </div>

          <div className="space-y-8">
            {passage.questions.map((q, idx) => (
              <div key={q.id} className="print:break-inside-avoid">
                <p className="font-bold text-slate-900 mb-3 print:text-black">
                  {idx + 1}. {q.question}
                </p>
                {viewMode === 'teacher' ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md print:border-black print:bg-transparent">
                    <p className="text-sm font-bold text-emerald-800 mb-1 print:text-black">Answer:</p>
                    <p className="text-emerald-900 text-sm print:text-black">{q.answer}</p>
                    <p className="text-emerald-800 text-xs mt-2 italic print:text-black">Ex: {q.explanation}</p>
                  </div>
                ) : (
                  <div className="w-full h-24 border-b border-slate-300 border-dashed relative">
                     {/* Lines for writing */}
                     <div className="absolute top-1/3 w-full border-b border-slate-200 border-dashed"></div>
                     <div className="absolute top-2/3 w-full border-b border-slate-200 border-dashed"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
        
        <div className="print:break-after-page"></div>

        {/* Part 2: Vocabulary Application */}
        <section className="mb-12 print:break-inside-avoid">
          <SectionHeader title="Part 2: Vocabulary Application" icon={CheckCircle2} />
          
          <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-200 print:bg-transparent print:border-black">
             <p className="text-sm font-bold text-slate-700 mb-2 uppercase print:text-black">Word Bank:</p>
             <div className="flex flex-wrap gap-2">
                {collection.length > 0 ? collection.map(w => (
                   <span key={w.id} className="px-2 py-1 bg-white border border-slate-300 rounded text-xs print:border-black">{w.text}</span>
                )) : <span className="text-sm italic text-slate-500">No words in collection. Using general academic vocabulary.</span>}
             </div>
          </div>

          <div className="space-y-8">
            {worksheetData.vocabExercises.map((ex, idx) => (
               <div key={ex.id} className="print:break-inside-avoid">
                  <h3 className="font-bold text-sm text-slate-500 uppercase mb-2 print:text-black">Passage {idx + 1}</h3>
                  <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm print:shadow-none print:border-black print:p-0">
                    <p className="leading-loose text-slate-800 font-serif print:text-black">
                      {ex.textWithBlanks.split('__________').map((part, i, arr) => (
                        <React.Fragment key={i}>
                          {part}
                          {i < arr.length - 1 && (
                             <span className="inline-block w-32 border-b-2 border-slate-800 mx-1 relative top-1">
                               {viewMode === 'teacher' && (
                                 <span className="absolute bottom-1 left-0 w-full text-center text-xs font-bold text-emerald-700 print:text-black">
                                   {ex.answers[i]}
                                 </span>
                               )}
                             </span>
                          )}
                        </React.Fragment>
                      ))}
                    </p>
                  </div>
               </div>
            ))}
          </div>
        </section>

        <div className="print:break-after-page"></div>

        {/* Part 3: Video Activity */}
        <section className="mb-12 print:break-inside-avoid">
          <SectionHeader title="Part 3: Video Analysis" icon={Video} />
          
          <div className="flex gap-4 mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200 print:border-black print:bg-transparent">
             <div className="shrink-0 bg-red-100 p-3 rounded-lg flex items-center justify-center h-fit print:hidden">
               <Youtube className="w-8 h-8 text-red-600" />
             </div>
             <div>
               <h3 className="font-bold text-lg text-slate-900 mb-1 print:text-black">{worksheetData.videoActivity.title}</h3>
               <p className="text-sm text-slate-600 mb-2 italic print:text-black">{worksheetData.videoActivity.description}</p>
               {worksheetData.videoActivity.url && (
                 <a href={worksheetData.videoActivity.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline text-sm font-medium print:text-black print:no-underline">
                   {worksheetData.videoActivity.url}
                 </a>
               )}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Multiple Choice */}
            <div className="space-y-6">
               <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 print:text-black">Multiple Choice</h4>
               {worksheetData.videoActivity.mcqs.map((q, i) => (
                 <div key={q.id} className="text-sm print:break-inside-avoid">
                   <p className="font-medium mb-2 print:text-black">{i + 1}. {q.question}</p>
                   <ul className="space-y-1 pl-4">
                     {q.options?.map((opt, optIdx) => (
                       <li key={optIdx} className="flex items-center gap-2">
                         <div className={`w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center ${viewMode === 'teacher' && opt === q.answer ? 'bg-emerald-600 border-emerald-600' : ''}`}>
                            {viewMode === 'teacher' && opt === q.answer && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                         </div>
                         <span className={`${viewMode === 'teacher' && opt === q.answer ? 'font-bold text-emerald-700' : 'text-slate-600'} print:text-black`}>{opt}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               ))}
            </div>

            {/* True / False */}
            <div className="space-y-6">
               <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 print:text-black">True or False</h4>
               {worksheetData.videoActivity.trueFalse.map((q, i) => (
                 <div key={q.id} className="text-sm flex justify-between items-start gap-4 print:break-inside-avoid">
                   <p className="font-medium print:text-black">{i + 1}. {q.question}</p>
                   <div className="flex gap-2 shrink-0">
                      {['True', 'False'].map(opt => (
                        <span key={opt} className={`px-2 py-0.5 border rounded text-xs ${viewMode === 'teacher' && q.answer === opt ? 'bg-emerald-100 border-emerald-500 text-emerald-800 font-bold' : 'border-slate-300 text-slate-400'} print:border-black print:text-black print:font-normal`}>
                          {opt}
                        </span>
                      ))}
                   </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="print:break-inside-avoid">
              <h4 className="font-bold text-slate-900 mb-4 print:text-black">New Vocabulary from Video</h4>
              <p className="text-sm text-slate-500 mb-4 print:text-black">Select 5 new words from the video and explain their meaning.</p>
              {[1,2,3,4,5].map(n => (
                 <div key={n} className="flex gap-4 mb-4 items-end">
                   <span className="font-bold text-sm w-6">{n}.</span>
                   <div className="flex-1 border-b border-slate-300 border-dashed pb-1 text-sm text-slate-400">Word</div>
                   <div className="flex-[3] border-b border-slate-300 border-dashed pb-1 text-sm text-slate-400">Meaning</div>
                 </div>
              ))}
            </div>

            <div className="print:break-inside-avoid">
              <h4 className="font-bold text-slate-900 mb-4 print:text-black">Summary</h4>
              <p className="text-sm text-slate-500 mb-4 print:text-black">Write 2-3 sentences summarizing the key points of the video.</p>
              <div className="space-y-6">
                <div className="w-full border-b border-slate-300 border-dashed"></div>
                <div className="w-full border-b border-slate-300 border-dashed"></div>
                <div className="w-full border-b border-slate-300 border-dashed"></div>
              </div>
            </div>
          </div>
        </section>
        
        <div className="print:break-after-page"></div>

        {/* Part 4: Writing Task */}
        <section className="print:break-inside-avoid">
           <SectionHeader title="Part 4: Writing Task" icon={FileText} />
           
           <div className="bg-stone-50 border border-stone-200 p-6 rounded-lg mb-8 print:bg-transparent print:border-black print:p-4">
             <h3 className="font-bold text-stone-500 uppercase tracking-widest text-xs mb-2 print:text-black">Prompt</h3>
             <p className="text-lg font-serif italic text-slate-900 print:text-black">"{passage.writingPrompt}"</p>
           </div>

           {/* Lined paper effect for writing */}
           <div className="flex flex-col">
             {Array.from({ length: 18 }).map((_, i) => (
               <div key={i} className="w-full border-b border-stone-300 border-dashed h-10 print:h-12"></div>
             ))}
           </div>
        </section>

      </div>
    </div>
  );
};
