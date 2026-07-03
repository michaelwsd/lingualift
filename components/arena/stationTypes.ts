import { CollectedWord } from '@/types';

export interface StationResult {
  /** How many tries it took to clear the station (1 = first try). */
  attempts: number;
  firstTry: boolean;
}

export interface StationProps {
  word: CollectedWord;
  /** Every word in the session — used to build distractors. */
  allWords: CollectedWord[];
  /** Called once when the student has cleared the station. */
  onComplete: (result: StationResult) => void;
}
