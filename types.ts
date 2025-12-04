
export enum LiteratureType {
  ESSAY = 'Essay',
  SHORT_STORY = 'Short Story',
  NEWS_ARTICLE = 'News Article',
  OPINION_PIECE = 'Opinion Piece',
  BIOGRAPHY = 'Biography',
  POEM = 'Poem'
}

export enum Theme {
  SCIENCE_TECH = 'Science & Technology',
  HISTORY = 'History',
  NATURE = 'Nature & Environment',
  SOCIETY = 'Society & Culture',
  ARTS = 'Arts & Literature',
  SPORTS = 'Sports & Health',
  CUSTOM = 'Custom Topic'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium'
}

export interface VocabularyWord {
  word: string;
  definition: string;
  exampleSentence: string;
  id: string; // Unique ID
}

export interface Question {
  id: string;
  question: string;
  answer: string;
  explanation: string;
}

export interface Passage {
  id: string;
  title: string;
  content: string; // Markdown supported
  vocabulary: VocabularyWord[];
  questions: Question[];
  writingPrompt: string;
  sampleResponse: string;
  theme: string;
  type: LiteratureType;
  createdAt: number;
}

export interface GenerationConfig {
  theme: Theme;
  customTopic?: string;
  literatureType: LiteratureType;
  difficulty: Difficulty;
}
