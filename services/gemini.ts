
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

const VOCAB_EXERCISE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    vocabExercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          textWithBlanks: { type: Type.STRING, description: "Passage with the target word replaced by __________." },
          answers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The correct word(s) for the blanks." }
        },
        required: ["textWithBlanks", "answers"]
      }
    }
  },
  required: ["vocabExercises"]
};

// Fallback video data for when search fails completely
const FALLBACK_VIDEOS = [
  {
    title: "The benefits of a bilingual brain",
    channel: "TED-Ed",
    url: "https://www.youtube.com/watch?v=MMmOLN5zBLY",
    description: "Mia Nacamulli details the three types of bilingual brains and shows how knowing more than one language keeps your brain healthy, complex and actively engaged.",
    topic: "Language Learning"
  },
  {
    title: "The history of our world in 18 minutes",
    channel: "TED",
    url: "https://www.youtube.com/watch?v=yqc9zX04DXs",
    description: "David Christian tells the history of the universe, from the Big Bang to the Internet, in a riveting 18 minutes.",
    topic: "Big History"
  },
  {
    title: "What is Consciousness?",
    channel: "Kurzgesagt – In a Nutshell",
    url: "https://www.youtube.com/watch?v=H6u0VBqNBQ8",
    description: "The origin of consciousness is one of the greatest mysteries of the universe. What is it and why do we have it?",
    topic: "Science"
  }
];

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
    5. Comprehension: Generate 5 reading comprehension questions to test the student's understanding of the text. Include the answer and an explanation.
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

  // We split this into two parallel requests for reliability
  // 1. Vocab generation (Uses JSON mode)
  // 2. Video search (Uses Tools)

  // --- Step 1: Generate Vocabulary Exercises ---
  const vocabPrompt = `
    Create 5 distinct, short passages (around 150 words each) related to the theme "${passageTopic}".
    Each passage must use a subset of these vocabulary words: [${vocabList}].
    In the 'textWithBlanks' output, replace the target vocabulary words with '__________'.
    Provide the correct words in the 'answers' array.
  `;

  const vocabRequest = ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: vocabPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: VOCAB_EXERCISE_SCHEMA
    }
  });

  // --- Step 2: Generate Video Activity ---
  // Strategy: Try to find a topic-specific video first. If that fails (due to lack of content or safety filters),
  // the model is instructed to fall back to ANY high-quality educational video (e.g. from a major channel).
  // This satisfies the "doesn't have to relate to the topic" constraint to ensure a valid result.
  const videoPrompt = `
    Task: Find a REAL, EXISTING, WATCHABLE YouTube video and generate assessment questions.
    Target Topic: "${passageTopic}".
    
    Constraints:
    1. Video Length: MUST be between 5 to 15 minutes.
    2. Video Content: Educational, Informational, or Interesting.
    3. PRIORITY: Try to find a video about "${passageTopic}".
    4. FALLBACK: If a good video for "${passageTopic}" is not found or is obscure, YOU MUST find a popular, high-quality "General Knowledge", "Science", or "History" video (e.g., from channels like TED-Ed, Vox, Veritasium, Kurzgesagt) instead. It is acceptable if it is not related to the topic, as long as it is a REAL video.
    
    REQUIREMENTS FOR QUESTIONS:
    - Generate EXACTLY 5 Multiple Choice Questions (MCQs).
    - Generate EXACTLY 5 True/False Questions.
    - The questions must be relevant to the video content.

    ACTION:
    USE the googleSearch tool. Search for: "site:youtube.com ${passageTopic} educational video 10 minutes". 
    If you doubt the results, search for: "site:youtube.com interesting educational video 10 minutes".

    Output JSON in a code block:
    \`\`\`json
    {
      "videoActivity": {
        "title": "Exact Video Title",
        "channel": "Channel Name (e.g. TED-Ed)",
        "url": "https://www.youtube.com/watch?v=...", 
        "description": "Brief summary",
        "mcqs": [
          { "question": "...", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "Option A" },
          // ... (Ensure exactly 5 MCQs)
        ],
        "trueFalse": [
          { "question": "...", "answer": "True" },
          // ... (Ensure exactly 5 True/False)
        ]
      }
    }
    \`\`\`
    
    CRITICAL: 
    - The 'url' MUST be a real link found in the search results. DO NOT fabricate URLs.
    - The 'answer' for MCQs MUST be the EXACT text string of one of the options.
    - Ensure there are EXACTLY 5 MCQs and 5 True/False questions.
  `;

  const videoRequest = ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: videoPrompt,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  try {
    const [vocabResponse, videoResponse] = await Promise.all([vocabRequest, videoRequest]);

    // --- Process Vocab Response ---
    const vocabText = vocabResponse.text;
    if (!vocabText) throw new Error("No vocabulary content generated");
    const vocabData = JSON.parse(vocabText);

    // --- Process Video Response ---
    let videoData;
    let videoText = videoResponse.text || "";
    const groundingChunks = videoResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    try {
        const jsonMatch = videoText.match(/```json\n([\s\S]*?)\n```/) || 
                          videoText.match(/```\n([\s\S]*?)\n```/) || 
                          videoText.match(/({[\s\S]*})/);
        
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : videoText;
        videoData = JSON.parse(jsonString);

        if (!videoData.videoActivity) throw new Error("Invalid structure");
    } catch (parseError) {
        // --- FALLBACK TO HARDCODED SAFE VIDEO ---
        // If the LLM failed to parse or use the tool correctly, we resort to a guaranteed valid video.
        // This ensures the user NEVER gets a broken worksheet.
        console.warn("Primary video search failed. Using safe fallback.", parseError);
        const randomVideo = FALLBACK_VIDEOS[Math.floor(Math.random() * FALLBACK_VIDEOS.length)];
        
        // We still need questions, so we ask Gemini to generate questions for this specific fallback video
        const fallbackPrompt = `
            Generate worksheet questions for this video:
            Title: "${randomVideo.title}"
            Description: "${randomVideo.description}"
            Topic: "${randomVideo.topic}"

            Generate:
            1. 5 Multiple Choice Questions (MCQ). 'answer' must be the exact option text.
            2. 5 True/False questions.

            Output JSON:
            {
                "mcqs": [{ "question": "...", "options": ["..."], "answer": "..." }],
                "trueFalse": [{ "question": "...", "answer": "True" }]
            }
        `;

        const qResponse = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: fallbackPrompt,
             config: { responseMimeType: "application/json" }
        });
        const qData = JSON.parse(qResponse.text || "{}");

        videoData = {
            videoActivity: {
                title: randomVideo.title,
                channel: randomVideo.channel,
                url: randomVideo.url,
                description: randomVideo.description,
                mcqs: qData.mcqs || [],
                trueFalse: qData.trueFalse || []
            }
        };
    }

    // --- Double Check URL against Grounding ---
    // If we successfully parsed the AI response, we still prefer the grounding metadata URL if available
    // to ensure it's a real click.
    let verifiedUrl = videoData.videoActivity.url;
    let verifiedTitle = videoData.videoActivity.title;
    // Attempt to trust the AI's channel extraction, but default to 'YouTube' if missing
    let verifiedChannel = videoData.videoActivity.channel || "YouTube"; 

    // Only override if we have high-confidence grounding matches
    if (groundingChunks) {
      for (const chunk of groundingChunks) {
        if (chunk.web?.title && (chunk.web.uri?.includes('youtube.com') || chunk.web.uri?.includes('youtu.be'))) {
           // Often titles are "Video Name - Channel - YouTube"
           const fullTitle = chunk.web.title;
           verifiedUrl = chunk.web.uri;
           
           // Simple heuristic to clean title if the AI didn't do it
           if (!videoData.videoActivity.channel) {
               const parts = fullTitle.split(' - ');
               if (parts.length >= 2) {
                   verifiedTitle = parts[0];
                   verifiedChannel = parts[1]; // Likely the channel
               } else {
                   verifiedTitle = fullTitle.replace(' - YouTube', '');
               }
           }
           break;
        }
      }
    }

    return {
      vocabExercises: vocabData.vocabExercises.map((ex: any) => ({
        ...ex,
        id: crypto.randomUUID()
      })),
      videoActivity: {
        ...videoData.videoActivity,
        url: verifiedUrl,
        title: verifiedTitle,
        channel: verifiedChannel,
        mcqs: videoData.videoActivity.mcqs.map((q: any) => ({ ...q, id: crypto.randomUUID(), type: 'MCQ' })),
        trueFalse: videoData.videoActivity.trueFalse.map((q: any) => ({ ...q, id: crypto.randomUUID(), type: 'TF' }))
      }
    };
  } catch (error) {
    console.error("Worksheet Generation Error:", error);
    throw error;
  }
};
