import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const EVALUATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: 'Score from 0 to 5. 5 = correct answer with proper grammar/punctuation. 4 = largely correct with minor issues. 3 = partially correct. 2 = mostly incorrect. 1 = attempted but wrong. 0 = completely wrong or irrelevant.',
    },
    feedback: {
      type: Type.STRING,
      description: 'A short (1-2 sentence) suggestion for the student on how to improve their response. Mention specific grammar, punctuation, or content errors if any. If the answer is perfect, say so briefly.',
    },
  },
  required: ['score', 'feedback'],
} as const;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, modelAnswer, studentAnswer } = await request.json() as {
      question: string;
      modelAnswer: string;
      studentAnswer: string;
    };

    if (!question || !modelAnswer || !studentAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a language teacher evaluating a student's reading comprehension answer.

Question: ${question}
Model Answer: ${modelAnswer}
Student's Answer: ${studentAnswer}

Evaluate the student's answer against the model answer. Consider:
1. Is the content/meaning largely correct?
2. Is the grammar correct?
3. Is the punctuation correct?
4. Is the spelling correct?

Give a score from 0-5 and a short feedback sentence. Be encouraging but specific about errors.
A score of 5 means the answer is correct with proper grammar and punctuation (it does not need to match the model answer word-for-word).
A score of 4 means largely correct with minor grammar/punctuation issues.
A score of 3 or below means significant content or language errors.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: EVALUATION_SCHEMA,
      },
    });

    const result = JSON.parse(response.text || '{}');

    return NextResponse.json({
      score: Math.min(5, Math.max(0, Math.round(result.score))),
      feedback: result.feedback || '',
    });
  } catch (error) {
    console.error('Failed to evaluate answer:', error);
    return NextResponse.json({ error: 'Failed to evaluate answer' }, { status: 500 });
  }
}
