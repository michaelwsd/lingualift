import { GenerationConfig, Passage, SavedWord, WorksheetData } from "@/types";

export const generatePassageContent = async (config: GenerationConfig): Promise<Omit<Passage, 'id' | 'createdAt' | 'theme' | 'type'>> => {
  const res = await fetch('/api/generate-passage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to generate passage");
  return res.json();
};

export const getWordDefinition = async (word: string): Promise<string> => {
  try {
    const res = await fetch('/api/word-definition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    });
    if (!res.ok) return "Could not load definition.";
    const data = await res.json();
    return data.definition;
  } catch {
    return "Could not load definition.";
  }
};

export const generateWordDetails = async (text: string, context: string): Promise<Omit<SavedWord, 'id' | 'text' | 'createdAt'>> => {
  const res = await fetch('/api/word-details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, context }),
  });
  if (!res.ok) throw new Error("Failed to get word details");
  return res.json();
};

export const generateCollectionPassage = async (words: string[]): Promise<string> => {
  if (words.length === 0) return "";
  const res = await fetch('/api/collection-passage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words }),
  });
  if (!res.ok) throw new Error("Failed to generate collection passage");
  const data = await res.json();
  return data.passage;
};

export const generateWorksheet = async (passageTopic: string, vocabWords: string[]): Promise<WorksheetData> => {
  const res = await fetch('/api/generate-worksheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passageTopic, vocabWords }),
  });
  if (!res.ok) throw new Error("Failed to generate worksheet");
  return res.json();
};
