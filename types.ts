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
  fillInBlankExercises: FillInBlankExercise[] | null;
  synonymExercises: SynonymExercise[] | null;
}

// --- Homework Types ---

export interface MCDefinitionQuestion {
  wordId: string;
  word: string;
  correctDefinition: string;
  options: string[];
}

export interface MCSynonymQuestion {
  wordId: string;
  word: string;
  correctSynonym: string;
  options: string[];
  optionDefinitions?: Record<string, string>;
}

export interface CrossMatchingData {
  words: { id: string; text: string }[];
  definitions: { id: string; text: string }[];
}

export type HomeworkPhase = 'vocab_review' | 'practice' | 'completed';

export type PracticeQuestionType =
  | 'mc_definition'
  | 'mc_synonym'
  | 'matching'
  | 'fill_in_blank'
  | 'grouping';

export interface PracticeQuestion {
  id: string;
  wordId: string;
  type: PracticeQuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  optionDefinitions?: Record<string, string>;
}

export interface PassageFillExercise {
  id: string;
  wordIds: string[];
  passage: string;
  answers: string[];
  wordBank: string[];
}

export interface WordMatchingExercise {
  id: string;
  wordIds: string[];
  words: { id: string; text: string }[];
  definitions: { id: string; text: string }[];
}

export interface SynonymBasketExercise {
  id: string;
  wordIds: string[];
  baskets: { id: string; word: string }[];
  synonymPool: { key: string; text: string; correctBasketId: string }[];
}

export interface PracticeSessionState {
  allQuestions: PracticeQuestion[];
  passageFills: PassageFillExercise[];
  matchingExercises: WordMatchingExercise[];
  basketExercises: SynonymBasketExercise[];
  queue: string[];
  currentQueueIndex: number;
  answeredCorrectly: string[];
  answeredIncorrectly: string[];
}

export interface GeneratedExercises {
  practiceQuestions: PracticeQuestion[];
  passageFillExercises: PassageFillExercise[];
  wordMatchingExercises: WordMatchingExercise[];
  synonymBasketExercises: SynonymBasketExercise[];
}

export type HomeworkType = 'vocabulary' | 'comprehension';

export interface HomeworkAssignment {
  id: string;
  teacher_id: string;
  student_id: string;
  student_name: string;
  assigned_at: string;
  status: 'pending' | 'in_progress' | 'completed';
  homework_type: HomeworkType;
  passage: Passage;
  collected_words: CollectedWord[];
  mc_definitions: MCDefinitionQuestion[];
  mc_synonyms: MCSynonymQuestion[];
  cross_matching_data: CrossMatchingData;
  synonym_groups: SynonymExercise;
  generated_exercises: GeneratedExercises;
}

export interface HomeworkProgress {
  id: string;
  homework_id: string;
  student_id: string;
  current_phase: HomeworkPhase;
  exercises_completed: string[];
  answers_given: Record<string, any>;
  updated_at: string;
}

export interface SentPassage {
  id: string;
  teacher_id: string;
  student_id: string;
  passage: Passage;
  sent_at: string;
}
