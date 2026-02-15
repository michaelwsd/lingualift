import { NextResponse } from "next/server";
import { explainWord } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { word, context } = await request.json();

    if (!word || typeof word !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'word' parameter" }, { status: 400 });
    }

    if (!context || typeof context !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'context' parameter" }, { status: 400 });
    }

    const result = await explainWord(word, context);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Explain word error:", error);
    return NextResponse.json({ error: "Failed to explain word" }, { status: 500 });
  }
}
