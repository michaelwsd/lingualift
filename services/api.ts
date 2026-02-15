import { GenerationConfig, Passage, FillInBlankExercise, SynonymExercise, HomeworkAssignment, HomeworkProgress, HomeworkPhase, CollectedWord } from "@/types";

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

// --- Homework API helpers ---

export const sendHomework = async (data: {
  studentId: string;
  studentName: string;
  passage: Passage;
  collectedWords: CollectedWord[];
}): Promise<{ success: boolean; id: string }> => {
  const res = await fetch('/api/homework/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to send homework");
  return res.json();
};

export interface HomeworkListItem {
  id: string;
  studentName: string;
  assignedAt: string;
  status: 'pending' | 'in_progress' | 'completed';
  passageTitle: string;
  passageType: string;
  wordCount: number;
}

export const fetchHomeworkList = async (): Promise<HomeworkListItem[]> => {
  const res = await fetch('/api/homework');
  if (!res.ok) throw new Error("Failed to fetch homework");
  const data = await res.json();
  return data.assignments;
};

export const fetchHomework = async (id: string): Promise<{
  assignment: HomeworkAssignment;
  progress: HomeworkProgress | null;
}> => {
  const res = await fetch(`/api/homework/${id}`);
  if (!res.ok) throw new Error("Failed to fetch homework");
  return res.json();
};

export const saveHomeworkProgress = async (
  homeworkId: string,
  data: {
    currentPhase: HomeworkPhase;
    score: number;
    exercisesCompleted: string[];
    answersGiven: Record<string, any>;
  }
): Promise<void> => {
  const res = await fetch(`/api/homework/${homeworkId}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save progress");
};

export interface StudentItem {
  id: string;
  name: string;
}

export const fetchStudents = async (): Promise<StudentItem[]> => {
  const res = await fetch('/api/students');
  if (!res.ok) throw new Error("Failed to fetch students");
  const data = await res.json();
  return data.students;
};

export const fetchMyStudents = async (): Promise<StudentItem[]> => {
  const res = await fetch('/api/homework/my-students');
  if (!res.ok) throw new Error("Failed to fetch students");
  const data = await res.json();
  return data.students;
};

export const fetchHomeworkByStudent = async (studentId: string): Promise<HomeworkListItem[]> => {
  const res = await fetch(`/api/homework/by-student/${studentId}`);
  if (!res.ok) throw new Error("Failed to fetch homework for student");
  const data = await res.json();
  return data.assignments;
};

export const deleteHomework = async (homeworkId: string): Promise<void> => {
  const res = await fetch(`/api/homework/${homeworkId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error("Failed to delete homework");
};

export const generateHomeworkFillInBlank = async (words: string[]): Promise<FillInBlankExercise> => {
  const res = await fetch('/api/homework/generate-fill-in-blank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words }),
  });
  if (!res.ok) throw new Error("Failed to generate fill-in-blank exercise");
  return res.json();
};
