
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GenerationConfig, Passage, VocabularyWord, Difficulty, SavedWord, WorksheetData } from "../types";

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

export const generateWorksheet = async (passageTopic: string, vocabWords: string[]): Promise<WorksheetData> => {
  const vocabList = vocabWords.length > 0 ? vocabWords.join(', ') : "sophisticated academic English vocabulary";
  
  const prompt = `
    Create a comprehensive educational worksheet based on the topic: "${passageTopic}".

    Task 1: Vocabulary Fill-in-the-Blanks
    - Create 5 distinct, short passages (around 150 words each) related to the theme "${passageTopic}".
    - Each passage must use a subset of these vocabulary words: [${vocabList}].
    - In the 'textWithBlanks' output, replace the target vocabulary words with '__________'.
    - Provide the correct words in the 'answers' array.

    Task 2: Video Activity
    - Use the Google Search tool to find a SPECIFIC, high-quality, educational YouTube video (approx 5-15 minutes) relevant to "${passageTopic}".
    - CRITICAL: You MUST use the search tool to find a real, existing YouTube URL. Ensure the video is playable. 
    - Provide the actual Title and the EXACT URL found (e.g., starts with https://www.youtube.com/watch?v=). Do NOT invent a URL.
    - Provide a brief description.
    - Generate 5 Multiple Choice Questions (MCQ) based on the likely content of such a video (general knowledge of the topic).
    - Generate 5 True/False questions based on the topic.

    IMPORTANT: Output the result strictly in valid JSON format. Do not use markdown code blocks like \`\`\`json.
    
    The JSON structure must be:
    {
      "vocabExercises": [
        {
          "textWithBlanks": "Passage text...",
          "answers": ["word1", "word2"]
        }
      ],
      "videoActivity": {
        "title": "Video Title",
        "url": "https://www.youtube.com/watch?v=...",
        "description": "Brief video summary",
        "mcqs": [
          { 
            "question": "Question text?", 
            "options": ["A", "B", "C", "D"], 
            "answer": "Correct Option Text" 
          }
        ],
        "trueFalse": [
          { 
            "question": "Statement?", 
            "answer": "True" 
          }
        ]
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], 
        // NOTE: responseMimeType and responseSchema are NOT supported when using tools.
        // We rely on the prompt to enforce strict JSON output.
      },
    });

    let text = response.text;
    if (!text) throw new Error("No worksheet content generated");
    
    // Clean up potential markdown formatting if the model adds it despite instructions
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Attempt to extract JSON if there is conversational filler text
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }
    
    const data = JSON.parse(text);

    return {
      vocabExercises: data.vocabExercises.map((ex: any) => ({
        ...ex,
        id: crypto.randomUUID()
      })),
      videoActivity: {
        ...data.videoActivity,
        mcqs: data.videoActivity.mcqs.map((q: any) => ({ ...q, id: crypto.randomUUID(), type: 'MCQ' })),
        trueFalse: data.videoActivity.trueFalse.map((q: any) => ({ ...q, id: crypto.randomUUID(), type: 'TF' }))
      }
    };
  } catch (error) {
    console.error("Worksheet Generation Error:", error);
    throw error;
  }
};
