
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerationConfig, Passage, VocabularyWord, Difficulty, SavedWord } from "../types";

// Initialize Gemini Client
// CRITICAL: API key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PASSAGE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A creative title for the passage" },
    content: { type: Type.STRING, description: "The content of the passage." },
    vocabulary: {
      type: Type.ARRAY,
      description: "A list of 5-8 challenging or key vocabulary words found in the passage.",
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The word exactly as it appears in the text." },
          definition: { type: Type.STRING, description: "A clear definition suitable for VCE students." },
          exampleSentence: { type: Type.STRING, description: "A new example sentence using the word (not from the passage)." }
        },
        required: ["word", "definition", "exampleSentence"]
      }
    },
    questions: {
      type: Type.ARRAY,
      description: "5 reading comprehension questions to test understanding.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "The question text." },
          answer: { type: Type.STRING, description: "The correct answer." },
          explanation: { type: Type.STRING, description: "Explanation referencing the text." }
        },
        required: ["question", "answer", "explanation"]
      }
    },
    writingPrompt: { type: Type.STRING, description: "A thought-provoking essay prompt related to the passage theme." },
    sampleResponse: { type: Type.STRING, description: "A VCE-standard essay response (~250 words) structured with Introduction, TEEL body paragraphs, and Conclusion. Paragraphs must be separated by double newlines." }
  },
  required: ["title", "content", "vocabulary", "questions", "writingPrompt", "sampleResponse"]
};

const WORD_DETAILS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    definition: { type: Type.STRING, description: "A concise definition of the word/phrase." },
    synonym: { type: Type.STRING, description: "A simple, easy-to-understand synonym." },
    exampleSentence: { type: Type.STRING, description: "A simple, clear example sentence using the word." }
  },
  required: ["definition", "synonym", "exampleSentence"]
};

export const generatePassageContent = async (config: GenerationConfig): Promise<Omit<Passage, 'id' | 'createdAt' | 'theme' | 'type'>> => {
  const topic = config.theme === 'Custom Topic' ? config.customTopic : config.theme;
  
  const isEasy = config.difficulty === Difficulty.EASY;
  const wordCount = isEasy ? "150-200" : "400-500";
  const complexity = isEasy 
    ? "Suitable for VCE English Unit 1/2 or EAL. Clearer expression, standard academic vocabulary." 
    : "Suitable for VCE English Unit 3/4. Sophisticated vocabulary, complex sentence structures, nuanced expression, and high-level analysis potential.";

  const prompt = `
    Write a ${config.literatureType} suitable for a VCE (Victorian Certificate of Education) English student.
    The topic is: "${topic}".
    
    Requirements:
    1. Length: Approximately ${wordCount} words.
    2. Difficulty Level: ${config.difficulty}. ${complexity}
    3. Tone: Appropriate for the literature type and VCE standards.
    4. Vocabulary: Include a list of challenging vocabulary words (metalanguage or sophisticated terms). These words MUST be extracted EXACTLY as they appear in the text.
    5. Comprehension: Generate 5 reading comprehension questions that test the student's understanding of the text. Include the answer and an explanation.
    6. Writing: Include a creative writing prompt and a high-quality sample response. The sample response MUST be structured as a formal VCE English essay:
       - Introduction
       - Body paragraphs following the TEEL structure (Topic sentence, Explanation, Evidence, Link)
       - Conclusion.
       - CRITICAL: Use double line breaks (\\n\\n) to separate the Introduction, each Body Paragraph, and the Conclusion.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: PASSAGE_SCHEMA,
        systemInstruction: "You are an expert VCE English teacher creating learning materials.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No content generated");

    const data = JSON.parse(text);
    
    // Map to ensure everything matches our internal structure
    return {
      title: data.title,
      content: data.content,
      vocabulary: data.vocabulary.map((v: any) => ({
        ...v,
        id: crypto.randomUUID(), // Generate a client-side ID
      })),
      questions: data.questions?.map((q: any) => ({
        ...q,
        id: crypto.randomUUID()
      })) || [],
      writingPrompt: data.writingPrompt || "Reflect on the passage.",
      sampleResponse: data.sampleResponse || "Sample response not available."
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const getWordDefinition = async (word: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Define the word "${word}" simply and clearly for a VCE English student. Max 20 words.`,
    });
    return response.text || "Definition not found.";
  } catch (error) {
    console.error("Definition Error:", error);
    return "Could not load definition.";
  }
};

export const generateWordDetails = async (text: string, context: string): Promise<Omit<SavedWord, 'id' | 'text' | 'createdAt'>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide details for the text: "${text}". The word was used in this context: "${context}".
                 1. Definition: Clear meaning.
                 2. Synonym: One simple, easy synonym.
                 3. Example: Write a simple example sentence using the word "${text}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: WORD_DETAILS_SCHEMA
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      definition: data.definition || "Definition unavailable",
      synonym: data.synonym || "N/A",
      exampleSentence: data.exampleSentence || "No example available."
    };
  } catch (error) {
    console.error("Word Details Error:", error);
    throw error;
  }
};

export const generateCollectionPassage = async (words: string[]): Promise<string> => {
  if (words.length === 0) return "";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a coherent, creative short passage (approximately 100-150 words) that naturally incorporates all of the following vocabulary words: ${words.join(', ')}. 
                 
                 Requirements:
                 1. Tone: Simple, accessible, and engaging for high school students. Avoid overly dense academic jargon.
                 2. Context: Construct sentences that provide clear context clues to demonstrate the meaning of each vocabulary word. The goal is to help the student learn the word's usage through the story.
                 3. Formatting: Highlight the vocabulary words in bold (using markdown **word**) when they appear in the text.`,
    });
    return response.text || "Could not generate passage.";
  } catch (error) {
    console.error("Collection Passage Generation Error:", error);
    throw error;
  }
};
