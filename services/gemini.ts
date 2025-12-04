
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerationConfig, Passage, VocabularyWord, Difficulty } from "../types";

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
          definition: { type: Type.STRING, description: "A clear, high-school level definition." },
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
    sampleResponse: { type: Type.STRING, description: "A well-structured sample response (approx 150 words) to the writing prompt." }
  },
  required: ["title", "content", "vocabulary", "questions", "writingPrompt", "sampleResponse"]
};

export const generatePassageContent = async (config: GenerationConfig): Promise<Omit<Passage, 'id' | 'createdAt' | 'theme' | 'type'>> => {
  const topic = config.theme === 'Custom Topic' ? config.customTopic : config.theme;
  
  const isEasy = config.difficulty === Difficulty.EASY;
  const wordCount = isEasy ? "150-200" : "400-500";
  const complexity = isEasy 
    ? "Simpler vocabulary and sentence structures (CEFR A2/B1). Easy to read." 
    : "Academic vocabulary and complex sentence structures (CEFR B2/C1).";

  const prompt = `
    Write a ${config.literatureType} suitable for an English student.
    The topic is: "${topic}".
    
    Requirements:
    1. Length: Approximately ${wordCount} words.
    2. Difficulty Level: ${config.difficulty}. ${complexity}
    3. Tone: Appropriate for the literature type.
    4. Vocabulary: Include a list of challenging vocabulary words. These words MUST be extracted EXACTLY as they appear in the text.
    5. Comprehension: Generate 5 reading comprehension questions that test the student's understanding of the text. Include the answer and an explanation.
    6. Writing: Include a creative writing prompt and a high-quality sample response.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: PASSAGE_SCHEMA,
        systemInstruction: "You are an expert English teacher creating learning materials.",
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
      contents: `Define the word "${word}" simply and clearly for an English learner. Max 20 words.`,
    });
    return response.text || "Definition not found.";
  } catch (error) {
    console.error("Definition Error:", error);
    return "Could not load definition.";
  }
};
