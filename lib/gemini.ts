import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerationConfig, Passage, SynonymGroup, CollectedWord, MCDefinitionQuestion, MCSynonymQuestion } from "@/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const TOPICS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    topics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactly 5 topic suggestions, each one sentence or one short phrase"
    }
  },
  required: ["topics"]
};

const PASSAGE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A creative title for the passage" },
    content: { type: Type.STRING, description: "The full passage content, approximately 400 words, split into 3-5 paragraphs separated by double newlines (\\n\\n)" },
    questions: {
      type: Type.ARRAY,
      description: "8 reading comprehension questions of varying difficulty (factual, inference, analysis)",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "The question text" },
          answer: { type: Type.STRING, description: "The correct answer" },
          explanation: { type: Type.STRING, description: "Explanation referencing the text" },
          relevantText: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "1-3 exact quotes from the passage that support the answer. These MUST be copied verbatim from the passage content."
          }
        },
        required: ["question", "answer", "explanation", "relevantText"]
      }
    }
  },
  required: ["title", "content", "questions"]
};

const WORD_EXPLANATION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    phonetic: { type: Type.STRING, description: "IPA phonetic transcription of the word enclosed in slashes, e.g. /rɪˈzɪl.i.ənt/. Use Australian English pronunciation." },
    meaning: { type: Type.STRING, description: "A clear, simple definition of the word suitable for EAL students. MUST NOT contain the word itself or any form of the word." },
    exampleSentence: { type: Type.STRING, description: "A simple example sentence using the word in a different context" },
    memoryTip: { type: Type.STRING, description: "A short memory tip or mnemonic to help remember the word" }
  },
  required: ["phonetic", "meaning", "exampleSentence", "memoryTip"]
};

const SYNONYM_GROUPS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    groups: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The original vocabulary word" },
          synonyms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-3 simple synonyms or short phrases with the same meaning. Each synonym must be a single word or very short phrase (2-3 words max). They must be simple enough for EAL students to understand."
          }
        },
        required: ["word", "synonyms"]
      }
    }
  },
  required: ["groups"]
};

const FILL_IN_BLANK_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    passage: {
      type: Type.STRING,
      description: "A short passage (~100 words) where target words are replaced with __BLANK_0__, __BLANK_1__, etc. markers"
    },
    answers: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "The correct words for each blank, in order matching the __BLANK_N__ markers"
    }
  },
  required: ["passage", "answers"]
};

export const suggestTopics = async (userInput?: string, format?: string): Promise<string[]> => {
  let prompt: string;

  if (userInput && format) {
    prompt = `Suggest 5 interesting, current-world topics for a ${format} article that are related to "${userInput}".
The topics are for middle-to-high school EAL (English as Additional Language) students in Australia.
Each topic should be one sentence or one short phrase.
Make them engaging, relevant to young people, and easy to understand.
Topics should be specific enough to write about, not too broad.`;
  } else if (userInput) {
    prompt = `Suggest 5 interesting, current-world topics related to "${userInput}".
The topics are for middle-to-high school EAL (English as Additional Language) students in Australia.
Each topic should be one sentence or one short phrase.
Make them engaging, relevant to young people, and easy to understand.
Topics should be specific enough to write about, not too broad.`;
  } else {
    prompt = `Suggest 5 interesting, diverse, current-world topics for reading comprehension articles.
The topics are for middle-to-high school EAL (English as Additional Language) students in Australia.
Each topic should be one sentence or one short phrase.
Cover a variety of subjects (science, culture, environment, technology, society).
Make them engaging, relevant to young people, and easy to understand.
Topics should be specific enough to write about, not too broad.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: TOPICS_SCHEMA,
      systemInstruction: "You are a helpful assistant for VCE EAL (English as Additional Language) educators in Victoria, Australia. Suggest topics that are culturally appropriate and interesting for students aged 15-18 who are learning English. Keep topics simple and accessible.",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No topics generated");
  const data = JSON.parse(text);
  return data.topics;
};

export const generatePassageContent = async (config: GenerationConfig): Promise<Omit<Passage, 'id' | 'createdAt' | 'topic' | 'type'>> => {
  const prompt = `
    Write a ${config.literatureType} suitable for a VCE EAL (English as Additional Language) student in Victoria, Australia.
    The topic is: "${config.topic}".

    Requirements:
    1. Length: Approximately 250 words.
    2. Structure: Split the passage into 3-5 paragraphs. Separate each paragraph with a double newline (\\n\\n). Each paragraph should focus on a distinct aspect or idea of the topic.
    3. Difficulty Level: Appropriate for VCE EAL students (intermediate English proficiency, ages 16-18).
       Use clear but sophisticated language. Include some challenging vocabulary but ensure the overall text is accessible.
       Avoid overly complex sentence structures but maintain an academic tone.
    4. Tone: Appropriate for the literature type and VCE EAL standards.
    5. Comprehension Questions: Generate exactly 8 reading comprehension questions of varying difficulty:
       - 3 factual questions (directly answered by the text)
       - 3 inference questions (require reading between the lines)
       - 2 analysis questions (require critical thinking about the text)
    6. For EACH question, provide 'relevantText': an array of 1-3 quotes from the passage.
       ABSOLUTE REQUIREMENT for relevantText:
       - Each string in relevantText MUST be copied CHARACTER-FOR-CHARACTER from the passage content above.
       - Use copy-paste. Do NOT reword, abbreviate, or rephrase.
       - Each quote should be a complete sentence or meaningful clause from the passage.
       - If you cannot find a direct quote, use the EXACT sentence from the passage that is closest to the answer.
       - VERIFY: every relevantText string must appear as a substring when you search the passage content.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: PASSAGE_SCHEMA,
      systemInstruction: "You are an expert VCE EAL (English as Additional Language) teacher creating learning materials for students whose first language is not English. Tailor content to be accessible yet challenging for intermediate English learners.",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No content generated");

  const data = JSON.parse(text);
  const passageContent = data.content as string;
  const contentLower = passageContent.toLowerCase();

  // Post-process: validate each relevantText is actually in the passage.
  // If not, try to find the best matching sentence from the passage.
  const sentences = passageContent.match(/[^.!?]+[.!?]+/g) || [];

  const questions = (data.questions || []).map((q: any) => {
    const rawTexts: string[] = Array.isArray(q.relevantText) ? q.relevantText : [];
    const validatedTexts = rawTexts.map((rt: string) => {
      // Check if it already exists in the passage (case-insensitive)
      if (contentLower.includes(rt.toLowerCase())) return rt;

      // Fuzzy fallback: find the sentence with the most word overlap
      const rtWords = new Set(rt.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3));
      let bestSentence = '';
      let bestScore = 0;
      for (const s of sentences) {
        const sWords = s.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const overlap = sWords.filter((w: string) => rtWords.has(w)).length;
        const score = rtWords.size > 0 ? overlap / rtWords.size : 0;
        if (score > bestScore) {
          bestScore = score;
          bestSentence = s.trim();
        }
      }
      return bestScore > 0.3 ? bestSentence : '';
    }).filter((rt: string) => rt.length > 0);

    return { ...q, relevantText: validatedTexts, id: crypto.randomUUID() };
  });

  return {
    title: data.title,
    content: passageContent,
    questions,
  };
};

export const explainWord = async (word: string, context: string): Promise<{ phonetic: string; meaning: string; exampleSentence: string; memoryTip: string }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Explain the word or phrase "${word}" for a VCE EAL (English as Additional Language) student.

The word appears in this context: "${context}"

Provide:
1. The IPA phonetic transcription of the word enclosed in slashes (e.g. /rɪˈzɪl.i.ənt/). Use Australian English pronunciation.
2. A clear, simple meaning of the word as used in this context.
   CRITICAL: The meaning MUST NOT contain the word "${word}" itself or any form/variation of it.
   Write the definition as if for a dictionary - describe the concept without using the target word.
   Bad example for "resilient": "Being resilient means able to recover quickly" (contains the word!)
   Good example for "resilient": "Able to recover quickly from difficulties; tough and adaptable"
3. A new, simple example sentence using the word (not from the original context).
4. A short, memorable tip or mnemonic to help an EAL student remember this word.

Keep everything simple, clear, and accessible for students learning English.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: WORD_EXPLANATION_SCHEMA,
      systemInstruction: "You are a friendly EAL teacher helping students build vocabulary. Use simple language. Make explanations clear and memorable.",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No word explanation generated");

  const data = JSON.parse(text);
  return {
    phonetic: data.phonetic,
    meaning: data.meaning,
    exampleSentence: data.exampleSentence,
    memoryTip: data.memoryTip,
  };
};

export const generateFillInBlank = async (words: string[]): Promise<{ passage: string; answers: string[] }> => {
  if (words.length === 0) {
    throw new Error("At least one word is required to generate a fill-in-blank exercise");
  }

  const wordList = words.map((w, i) => `${i}. "${w}"`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Create a fill-in-the-blank exercise using ALL of the following vocabulary words:

${wordList}

Requirements:
1. Write a coherent, engaging short passage of approximately 100 words.
2. The passage should be suitable for VCE EAL students (intermediate English, ages 16-18).
3. Use ALL ${words.length} words naturally in the passage.
4. Replace each word with a marker: __BLANK_0__ for word 0, __BLANK_1__ for word 1, etc.
5. The words should be spread throughout the passage, NOT clustered together.
6. The passage should provide enough context clues for students to identify which word goes in each blank.
7. The 'answers' array must contain the words in order: answers[0] = word for __BLANK_0__, answers[1] = word for __BLANK_1__, etc.
8. Make the passage interesting and relatable for young people.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: FILL_IN_BLANK_SCHEMA,
      systemInstruction: "You are a VCE EAL teacher creating vocabulary exercises. Write clear, engaging passages that help students practice using new words in context.",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No fill-in-blank exercise generated");

  const data = JSON.parse(text);
  return {
    passage: data.passage,
    answers: data.answers,
  };
};

export const generateSynonyms = async (words: string[]): Promise<SynonymGroup[]> => {
  if (words.length === 0) {
    throw new Error("At least one word is required to generate synonyms");
  }

  const wordList = words.map((w, i) => `${i + 1}. "${w}"`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate 2-3 simple synonyms for each of the following vocabulary words:

${wordList}

Requirements:
1. Each synonym must be a DIFFERENT word or very short phrase (2-3 words max) that means the same thing.
2. Synonyms should be simple and accessible for EAL students (ages 16-18, intermediate English).
3. Do NOT repeat any synonym across different words — each synonym must be unique to its word.
4. Do NOT use the original word itself as a synonym.
5. Prefer common, everyday words that students would already know.
6. The synonyms should be clearly associated with ONLY their target word, not ambiguous between multiple words in the list.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: SYNONYM_GROUPS_SCHEMA,
      systemInstruction: "You are a VCE EAL teacher helping students learn vocabulary through synonym exercises. Generate clear, unambiguous synonyms.",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No synonyms generated");

  const data = JSON.parse(text);
  return data.groups;
};

// --- Homework-specific generation functions ---

const MC_DEFINITIONS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The vocabulary word" },
          correctDefinition: { type: Type.STRING, description: "The correct definition of the word" },
          distractors: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 4 plausible but INCORRECT definitions"
          }
        },
        required: ["word", "correctDefinition", "distractors"]
      }
    }
  },
  required: ["questions"]
};

const MC_SYNONYMS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The vocabulary word" },
          correctSynonym: { type: Type.STRING, description: "A correct synonym for the word" },
          distractors: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 4 real English words that are NOT synonyms of the target word"
          },
          optionDefinitions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING, description: "The option word" },
                definition: { type: Type.STRING, description: "A brief, simple definition of this word" }
              },
              required: ["word", "definition"]
            },
            description: "A brief definition for each option word (correctSynonym + all 4 distractors). Must have exactly 5 entries."
          }
        },
        required: ["word", "correctSynonym", "distractors", "optionDefinitions"]
      }
    }
  },
  required: ["questions"]
};

const HOMEWORK_SYNONYM_GROUPS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    groups: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The original vocabulary word" },
          synonyms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-5 simple synonyms or short phrases with the same meaning. Each must be simple enough for EAL students."
          }
        },
        required: ["word", "synonyms"]
      }
    }
  },
  required: ["groups"]
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const generateMCDefinitions = async (words: CollectedWord[]): Promise<MCDefinitionQuestion[]> => {
  const wordList = words.map((w, i) => `${i + 1}. Word: "${w.word}" — Correct definition: "${w.meaning}"`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate multiple-choice definition questions for the following vocabulary words.

For EACH word, I am providing the correct definition. You must generate exactly 4 DISTRACTOR definitions that are:
- Plausible and similar in style/length to the correct definition
- Clearly WRONG (not partial matches or near-synonyms of the correct meaning)
- Related to the general domain but describing a different concept
- Simple enough for EAL students to understand

Words and their correct definitions:
${wordList}

IMPORTANT:
- Generate exactly 4 distractors per word
- The distractors must NOT be correct or partially correct definitions of the target word
- Each distractor should be a complete, grammatically correct definition
- Distractors should be distinct from each other`,
    config: {
      responseMimeType: "application/json",
      responseSchema: MC_DEFINITIONS_SCHEMA,
      systemInstruction: "You are a VCE EAL teacher creating vocabulary assessment exercises. Generate plausible but clearly incorrect distractor definitions.",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No MC definitions generated");

  const data = JSON.parse(text);
  return data.questions.map((q: any, i: number) => ({
    wordId: words[i].id,
    word: words[i].word,
    phonetic: words[i].phonetic || undefined,
    correctDefinition: words[i].meaning,
    options: shuffle([words[i].meaning, ...q.distractors.slice(0, 4)]),
  }));
};

export const generateMCSynonyms = async (words: CollectedWord[]): Promise<MCSynonymQuestion[]> => {
  const wordList = words.map((w, i) => `${i + 1}. "${w.word}" (meaning: ${w.meaning})`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate multiple-choice synonym questions for the following vocabulary words.

For EACH word, generate:
- 1 correct synonym (a word or short phrase that means the same thing)
- 4 distractor words that are real English words but are NOT synonyms of the target word

Words:
${wordList}

IMPORTANT:
- The correct synonym must clearly mean the same thing as the target word
- Distractors must be real, common English words that an EAL student would recognize
- Distractors should NOT be synonyms or near-synonyms of the target word
- All 5 options (1 correct + 4 distractors) should be similar in complexity
- Do not reuse any word across different questions' options
- For EACH question, provide optionDefinitions: a brief, simple definition for every option word (the correct synonym AND all 4 distractors). Each definition should be 1 short sentence.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: MC_SYNONYMS_SCHEMA,
      systemInstruction: "You are a VCE EAL teacher creating vocabulary synonym exercises. Generate clear, unambiguous synonym questions.",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No MC synonyms generated");

  const data = JSON.parse(text);
  return data.questions.map((q: any, i: number) => {
    const optionDefs: Record<string, string> = {};
    if (Array.isArray(q.optionDefinitions)) {
      for (const od of q.optionDefinitions) {
        optionDefs[od.word.toLowerCase()] = od.definition;
      }
    }
    return {
      wordId: words[i].id,
      word: words[i].word,
      phonetic: words[i].phonetic || undefined,
      correctSynonym: q.correctSynonym,
      options: shuffle([q.correctSynonym, ...q.distractors.slice(0, 4)]),
      optionDefinitions: optionDefs,
    };
  });
};

export const generateHomeworkSynonyms = async (words: string[]): Promise<SynonymGroup[]> => {
  if (words.length === 0) {
    throw new Error("At least one word is required to generate synonyms");
  }

  const wordList = words.map((w, i) => `${i + 1}. "${w}"`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate 3-5 simple synonyms for each of the following vocabulary words:

${wordList}

Requirements:
1. Each synonym must be a DIFFERENT word or very short phrase (2-3 words max) that means the same thing.
2. Generate between 3 and 5 synonyms per word.
3. Synonyms should be simple and accessible for EAL students (ages 16-18, intermediate English).
4. Do NOT repeat any synonym across different words — each synonym must be unique to its word.
5. Do NOT use the original word itself as a synonym.
6. Prefer common, everyday words that students would already know.
7. The synonyms should be clearly associated with ONLY their target word, not ambiguous between multiple words in the list.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: HOMEWORK_SYNONYM_GROUPS_SCHEMA,
      systemInstruction: "You are a VCE EAL teacher helping students learn vocabulary through synonym exercises. Generate clear, unambiguous synonyms. Provide 3-5 synonyms per word.",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No homework synonyms generated");

  const data = JSON.parse(text);
  return data.groups;
};

export const generateHomeworkFillInBlank = async (words: string[]): Promise<{ passage: string; answers: string[] }> => {
  if (words.length === 0) {
    throw new Error("At least one word is required");
  }

  const blankWords = words.length <= 10 ? words : words.slice(0, 10);
  const wordList = blankWords.map((w, i) => `${i}. "${w}"`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Create a fill-in-the-blank exercise using ALL of the following vocabulary words:

${wordList}

Requirements:
1. Write a coherent, engaging passage of approximately 150 words.
2. The passage MUST be suitable for EAL (English as Additional Language) students — use simple sentence structures and clear context.
3. Use ALL ${blankWords.length} words naturally in the passage. Each word must appear EXACTLY ONCE — no duplicates.
4. Replace each word with a marker: __BLANK_0__ for word 0, __BLANK_1__ for word 1, etc.
5. The words should be spread evenly throughout the passage, NOT clustered together.
6. The passage should provide strong context clues for each blank so students can identify which word fits.
7. The 'answers' array must contain the words in order: answers[0] = word for __BLANK_0__, etc.
8. Make the passage interesting and relatable for young people aged 15-18.
9. Do NOT use any of the vocabulary words elsewhere in the passage (only in their blank positions).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: FILL_IN_BLANK_SCHEMA,
      systemInstruction: "You are a VCE EAL teacher creating vocabulary exercises. Write clear, engaging, EAL-appropriate passages that help students practice using new words in context.",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No homework fill-in-blank generated");

  const data = JSON.parse(text);
  return {
    passage: data.passage,
    answers: data.answers,
  };
};
