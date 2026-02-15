export enum LiteratureType {
  SHORT_STORY = 'Short Story',
  NEWS_ARTICLE = 'News Article',
  OPINION_PIECE = 'Opinion Piece',
  BIOGRAPHY = 'Biography',
}

export interface GenerationConfig {
  topic: string;
  literatureType: LiteratureType;
}

export interface ComprehensionQuestion {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  relevantText: string[];
}

export interface Passage {
  id: string;
  title: string;
  content: string;
  questions: ComprehensionQuestion[];
  topic: string;
  type: LiteratureType;
  createdAt: number;
}

export interface CollectedWord {
  id: string;
  word: string;
  meaning: string;
  exampleSentence: string;
  memoryTip: string;
}

export interface FillInBlankExercise {
  passage: string;
  answers: string[];
}

export interface SynonymGroup {
  word: string;
  synonyms: string[];
}

export interface SynonymExercise {
  groups: SynonymGroup[];
}

export interface SavedSession {
  id: string;
  savedAt: number;
  passage: Passage;
  collectedWords: CollectedWord[];
  fillInBlankExercise: FillInBlankExercise | null;
  synonymExercise: SynonymExercise | null;
}
