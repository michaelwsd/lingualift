import { CollectedWord } from '@/types';

// --- Station model ---

export type StationType = 'meaning' | 'define' | 'spell' | 'unscramble' | 'use_it';

export interface StationMeta {
  type: StationType;
  label: string;
  /** Short imperative shown to the student when the station opens */
  tagline: string;
  /** Which weakness this station targets — shown in the lobby */
  targets: string;
}

export const STATION_META: Record<StationType, StationMeta> = {
  meaning: {
    type: 'meaning',
    label: 'Meaning Match',
    tagline: 'Pick the correct meaning',
    targets: 'Understanding',
  },
  define: {
    type: 'define',
    label: 'Define It',
    tagline: 'Explain the meaning in your own words',
    targets: 'Recall',
  },
  spell: {
    type: 'spell',
    label: 'Listen & Spell',
    tagline: 'Hear it, then spell it',
    targets: 'Spelling',
  },
  unscramble: {
    type: 'unscramble',
    label: 'Unscramble',
    tagline: 'Rebuild the word',
    targets: 'Spelling',
  },
  use_it: {
    type: 'use_it',
    label: 'Use It',
    tagline: 'Write a sentence',
    targets: 'Usage',
  },
};

/** Default order a word is taken through — the mastery gauntlet. */
export const DEFAULT_STATIONS: StationType[] = ['meaning', 'define', 'spell', 'unscramble', 'use_it'];

export interface ArenaConfig {
  /** Stations each word is taken through, in order. */
  stations: StationType[];
  /** How many words to include (subset, shuffled). */
  wordCount: number;
}

// --- Scoring ---

export const BASE_POINTS = 100;
export const MAX_MULTIPLIER = 3;

/** Streak → score multiplier. 0→1x, 1→1.25x … capped at 3x. */
export function streakMultiplier(streak: number): number {
  return Math.min(1 + streak * 0.25, MAX_MULTIPLIER);
}

/** Points for clearing a station given attempts + current streak. */
export function stationPoints(attempts: number, streak: number): number {
  const tryFactor = attempts <= 1 ? 1 : attempts === 2 ? 0.5 : 0.25;
  return Math.round(BASE_POINTS * tryFactor * streakMultiplier(streak));
}

// --- Text helpers ---

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

/** Levenshtein distance — used for fuzzy pronunciation matching. */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

/**
 * Does a heard transcript plausibly contain the target word?
 * Tolerant: speech recognition often returns the word inside a phrase,
 * a homophone, or a near-miss. We accept exact token match or a close
 * Levenshtein match on any token, plus a whole-string fallback.
 */
export function transcriptMatchesWord(transcript: string, word: string): boolean {
  const target = normalize(word);
  if (!target) return false;
  const heard = normalize(transcript);
  if (!heard) return false;
  if (heard === target) return true;

  const tolerance = target.length <= 4 ? 1 : target.length <= 7 ? 2 : 3;
  const tokens = heard.split(' ');
  for (const tok of tokens) {
    if (tok === target) return true;
    if (levenshtein(tok, target) <= tolerance) return true;
  }
  // Multi-word targets: compare the whole phrase.
  if (target.includes(' ') && levenshtein(heard, target) <= tolerance) return true;
  return false;
}

// --- Shuffle & selection ---

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickWords(words: CollectedWord[], count: number): CollectedWord[] {
  if (count >= words.length) return shuffle(words);
  return shuffle(words).slice(0, count);
}

/** Build 4 shuffled meaning options for a word (correct + distractors). */
export function buildMeaningOptions(word: CollectedWord, allWords: CollectedWord[]): string[] {
  const distractors = shuffle(
    allWords.filter(w => w.id !== word.id && normalize(w.meaning) !== normalize(word.meaning)).map(w => w.meaning)
  ).slice(0, 3);
  return shuffle([word.meaning, ...distractors]);
}

export interface LetterTile {
  key: string;
  char: string;
}

/** Scramble a word into letter tiles, guaranteeing the order differs. */
export function scrambleWord(word: string): LetterTile[] {
  const chars = word.split('');
  if (chars.length <= 1) return chars.map((char, i) => ({ key: `${i}-${char}`, char }));

  let scrambled = chars;
  let attempts = 0;
  do {
    scrambled = shuffle(chars);
    attempts++;
  } while (scrambled.join('') === word && attempts < 10);

  return scrambled.map((char, i) => ({ key: `${i}-${char}-${Math.random().toString(36).slice(2, 7)}`, char }));
}

// --- Web Speech API typing (minimal, since TS DOM lib omits it) ---

export interface SpeechRecognitionResultLike {
  transcript: string;
  confidence: number;
}
