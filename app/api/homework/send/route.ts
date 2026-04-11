import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateMCDefinitions, generateMCSynonyms, generateHomeworkSynonyms, generateHomeworkFillInBlank } from '@/lib/gemini';
import {
  CollectedWord,
  MCDefinitionQuestion,
  MCSynonymQuestion,
  SynonymGroup,
  PracticeQuestion,
  PassageFillExercise,
  WordMatchingExercise,
  GeneratedExercises,
} from '@/types';

// --- Helpers ---

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pickDistractors(allWords: string[], correctWord: string, count: number): string[] {
  const others = allWords.filter(w => w.toLowerCase() !== correctWord.toLowerCase());
  return shuffle(others).slice(0, count);
}

function partitionItems<T>(items: T[]): T[][] {
  const shuffled = shuffle(items);
  const n = shuffled.length;
  if (n === 0) return [];
  if (n <= 3) return [shuffled];

  let numGroups: number;
  if (n <= 10) numGroups = 2;
  else if (n <= 20) numGroups = 3;
  else numGroups = 4;

  numGroups = Math.min(numGroups, n);
  const baseSize = Math.floor(n / numGroups);
  const remainder = n % numGroups;

  const groups: T[][] = [];
  let idx = 0;
  for (let i = 0; i < numGroups; i++) {
    const size = baseSize + (i < remainder ? 1 : 0);
    groups.push(shuffled.slice(idx, idx + size));
    idx += size;
  }
  return groups;
}

// --- Exercise Generators ---

function buildPracticeQuestions(
  mcDefinitions: MCDefinitionQuestion[],
  mcSynonyms: MCSynonymQuestion[],
  collectedWords: CollectedWord[],
  synonymGroups: SynonymGroup[],
): PracticeQuestion[] {
  const questions: PracticeQuestion[] = [];
  const allWordTexts = collectedWords.map(w => w.word);

  // Build word→definition and word→phonetic lookups from collected words
  const wordDefLookup: Record<string, string> = {};
  const wordPhoneticLookup: Record<string, string> = {};
  for (const cw of collectedWords) {
    wordDefLookup[cw.word.toLowerCase()] = cw.meaning;
    if (cw.phonetic) wordPhoneticLookup[cw.word.toLowerCase()] = cw.phonetic;
  }

  function getOptionDefs(options: string[], extraDefs?: Record<string, string>): Record<string, string> {
    const defs: Record<string, string> = {};
    for (const opt of options) {
      const key = opt.toLowerCase();
      defs[key] = extraDefs?.[key] || wordDefLookup[key] || '';
    }
    return defs;
  }

  // MC Definition — options are definitions, not words; no optionDefinitions needed
  for (const q of mcDefinitions) {
    const others = q.options.filter(o => o !== q.correctDefinition);
    questions.push({
      id: `${q.wordId}_mc_definition`,
      wordId: q.wordId,
      type: 'mc_definition',
      prompt: q.word,
      phonetic: q.phonetic || wordPhoneticLookup[q.word.toLowerCase()],
      options: shuffle([q.correctDefinition, ...shuffle(others).slice(0, 3)]),
      correctAnswer: q.correctDefinition,
    });
  }

  // MC Synonym — options are synonym words; use Gemini-provided definitions
  for (const q of mcSynonyms) {
    const others = q.options.filter(o => o !== q.correctSynonym);
    const opts = shuffle([q.correctSynonym, ...shuffle(others).slice(0, 3)]);
    questions.push({
      id: `${q.wordId}_mc_synonym`,
      wordId: q.wordId,
      type: 'mc_synonym',
      prompt: q.word,
      phonetic: q.phonetic || wordPhoneticLookup[q.word.toLowerCase()],
      options: opts,
      correctAnswer: q.correctSynonym,
      optionDefinitions: getOptionDefs(opts, q.optionDefinitions),
    });
  }

  // Matching (definition → word) — options are vocab words
  for (const cw of collectedWords) {
    const distractors = pickDistractors(allWordTexts, cw.word, 3);
    const opts = shuffle([cw.word, ...distractors]);
    questions.push({
      id: `${cw.id}_matching`,
      wordId: cw.id,
      type: 'matching',
      prompt: cw.meaning,
      options: opts,
      correctAnswer: cw.word,
      optionDefinitions: getOptionDefs(opts),
    });
  }

  // Fill-in-blank (from example sentence) — options are vocab words
  for (const cw of collectedWords) {
    const regex = new RegExp(`\\b${escapeRegex(cw.word)}\\b`, 'gi');
    const blanked = cw.exampleSentence.replace(regex, '______');
    if (blanked !== cw.exampleSentence) {
      const distractors = pickDistractors(allWordTexts, cw.word, 3);
      const opts = shuffle([cw.word, ...distractors]);
      questions.push({
        id: `${cw.id}_fill_in_blank`,
        wordId: cw.id,
        type: 'fill_in_blank',
        prompt: blanked,
        options: opts,
        correctAnswer: cw.word,
        optionDefinitions: getOptionDefs(opts),
      });
    }
  }

  // Grouping (synonym → word) — options are vocab words
  const groupHeaders = synonymGroups.map(g => g.word);
  if (groupHeaders.length >= 2) {
    for (const group of synonymGroups) {
      if (group.synonyms.length > 0) {
        const synonym = group.synonyms[Math.floor(Math.random() * group.synonyms.length)];
        const wordEntry = collectedWords.find(
          w => w.word.toLowerCase() === group.word.toLowerCase()
        );
        const wordId = wordEntry?.id || group.word;
        const distractorHeaders = groupHeaders.filter(h => h !== group.word);
        const picked = shuffle(distractorHeaders).slice(0, 3);
        const opts = shuffle([group.word, ...picked]);
        questions.push({
          id: `${wordId}_grouping`,
          wordId,
          type: 'grouping',
          prompt: synonym,
          options: opts,
          correctAnswer: group.word,
          optionDefinitions: getOptionDefs(opts),
        });
      }
    }
  }

  return questions;
}

function buildWordMatchingExercises(words: CollectedWord[]): WordMatchingExercise[] {
  const groups = partitionItems(words);
  return groups.map((group, i) => ({
    id: `word_matching_${i}`,
    wordIds: group.map(w => w.id),
    words: shuffle(group.map(w => ({ id: w.id, text: w.word }))),
    definitions: shuffle(group.map(w => ({ id: w.id, text: w.meaning }))),
  }));
}

async function buildPassageFillExercises(words: CollectedWord[], allWordTexts: string[]): Promise<PassageFillExercise[]> {
  const groups = partitionItems(words);
  const exercises: PassageFillExercise[] = [];

  const results = await Promise.allSettled(
    groups.map(async (group, i) => {
      const wordTexts = group.map(w => w.word);
      const result = await generateHomeworkFillInBlank(wordTexts);
      return {
        id: `passage_fill_${i}`,
        wordIds: group.map(w => w.id),
        passage: result.passage,
        answers: result.answers,
        wordBank: shuffle([...allWordTexts]),
      } as PassageFillExercise;
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled') exercises.push(r.value);
  }

  return exercises;
}

// --- Route Handler ---

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, studentName, passage, collectedWords } = await request.json() as {
      studentId: string;
      studentName: string;
      passage: any;
      collectedWords: CollectedWord[];
    };

    if (!studentId || !passage || !collectedWords?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Phase 1: Generate Gemini-powered data in parallel
    const [mcDefinitions, mcSynonyms, synonymGroups] = await Promise.all([
      generateMCDefinitions(collectedWords),
      generateMCSynonyms(collectedWords),
      generateHomeworkSynonyms(collectedWords.map(w => w.word)),
    ]);

    // Phase 2: Build all exercises (passage fill calls Gemini too)
    const allWordTexts = collectedWords.map(w => w.word);

    const [practiceQuestions, wordMatchingExercises, passageFillExercises] = await Promise.all([
      Promise.resolve(buildPracticeQuestions(mcDefinitions, mcSynonyms, collectedWords, synonymGroups)),
      Promise.resolve(buildWordMatchingExercises(collectedWords)),
      buildPassageFillExercises(collectedWords, allWordTexts),
    ]);

    const generatedExercises: GeneratedExercises = {
      practiceQuestions,
      passageFillExercises,
      wordMatchingExercises,
      synonymBasketExercises: [],
    };

    // Prepare cross-matching data (for teacher preview backward compat)
    const crossMatchingData = {
      words: shuffle(collectedWords.map(w => ({ id: w.id, text: w.word }))),
      definitions: shuffle(collectedWords.map(w => ({ id: w.id, text: w.meaning }))),
    };

    const { data, error } = await supabaseAdmin
      .from('homework_assignments')
      .insert({
        teacher_id: userId,
        student_id: studentId,
        student_name: studentName,
        homework_type: 'vocabulary',
        passage,
        collected_words: collectedWords,
        mc_definitions: mcDefinitions,
        mc_synonyms: mcSynonyms,
        cross_matching_data: crossMatchingData,
        synonym_groups: { groups: synonymGroups },
        generated_exercises: generatedExercises,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save homework' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Failed to send homework:', error);
    return NextResponse.json({ error: 'Failed to send homework' }, { status: 500 });
  }
}
