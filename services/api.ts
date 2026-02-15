import { GenerationConfig, Passage, FillInBlankExercise, SynonymExercise } from "@/types";

export const suggestTopics = async (userInput?: string, format?: string): Promise<string[]> => {
  const res = await fetch('/api/suggest-topics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput, format }),
  });
  if (!res.ok) throw new Error("Failed to suggest topics");
  const data = await res.json();
  return data.topics;
};

export const generatePassageContent = async (config: GenerationConfig): Promise<Omit<Passage, 'id' | 'createdAt' | 'topic' | 'type'>> => {
  const res = await fetch('/api/generate-passage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to generate passage");
  return res.json();
};

export const explainWord = async (word: string, context: string): Promise<{ meaning: string; exampleSentence: string; memoryTip: string }> => {
  const res = await fetch('/api/explain-word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, context }),
  });
  if (!res.ok) throw new Error("Failed to explain word");
  return res.json();
};

export const generateFillInBlank = async (words: string[]): Promise<FillInBlankExercise> => {
  const res = await fetch('/api/fill-in-blank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words }),
  });
  if (!res.ok) throw new Error("Failed to generate fill-in-blank exercise");
  return res.json();
};

export const generateSynonyms = async (words: string[]): Promise<SynonymExercise> => {
  const res = await fetch('/api/generate-synonyms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words }),
  });
  if (!res.ok) throw new Error("Failed to generate synonyms");
  return res.json();
};
