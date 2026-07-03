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

export interface PlanMeta {
  planId: string;
  day: number;
  totalDays: number;
  unlockDate: string | null;
}

export interface Passage {
  id: string;
  title: string;
  content: string;
  questions: ComprehensionQuestion[];
  topic: string;
  type: LiteratureType;
  createdAt: number;
  /** Present on practice-plan homework passages. */
  plan?: PlanMeta;
}

export interface CollectedWord {
  id: string;
  word: string;
  phonetic?: string;
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
  phonetic?: string;
  correctDefinition: string;
  options: string[];
}

export interface MCSynonymQuestion {
  wordId: string;
  word: string;
  phonetic?: string;
  correctSynonym: string;
  options: string[];
  optionDefinitions?: Record<string, string>;
}

export interface CrossMatchingData {
  words: { id: string; text: string }[];
  definitions: { id: string; text: string }[];
}

export type HomeworkPhase = 'vocab_review' | 'learning' | 'practice' | 'completed';

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
  phonetic?: string;
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

// --- Vocabulary Mastery (student 4-skill gauntlet) ---

export type VocabSkill = 'meaning' | 'define' | 'spell' | 'use_it';

export interface VocabMasteryState {
  /** Task ids in play order, each `${wordId}::${skill}`. */
  order: string[];
  clearedTaskIds: string[];
  currentIndex: number;
  points: number;
  streak: number;
  bestStreak: number;
  /** taskId → attempts it took to clear. */
  taskAttempts: Record<string, number>;
  /** skill → first-try / total tallies (for the results breakdown). */
  perSkill: Record<string, { firstTry: number; total: number }>;
  /** words where all four skills were cleared on the first try. */
  masteredWordIds: string[];
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
  due_date?: string | null;
  unlock_date?: string | null;
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
