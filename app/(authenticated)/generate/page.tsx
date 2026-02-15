'use client';

import { useLinguaLift } from '@/contexts/LinguaLiftContext';
import { GeneratorForm } from '@/components/GeneratorForm';
import { useRouter } from 'next/navigation';
import { generatePassageContent } from '@/services/api';
import { GenerationConfig } from '@/types';

export default function GeneratePage() {
  const { setPassage, clearCollectedWords, isGenerating, setIsGenerating } = useLinguaLift();
  const router = useRouter();

  const handleGenerate = async (config: GenerationConfig) => {
    setIsGenerating(true);
    try {
      const result = await generatePassageContent(config);
      setPassage({
        ...result,
        id: crypto.randomUUID(),
        topic: config.topic,
        type: config.literatureType,
        createdAt: Date.now(),
      });
      clearCollectedWords();
      router.push('/learn');
    } catch (error) {
      console.error(error);
      alert("Failed to generate passage. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center px-4 sm:px-6 overflow-y-auto py-6 sm:py-10">
      <GeneratorForm onGenerate={handleGenerate} isGenerating={isGenerating} />
    </div>
  );
}
