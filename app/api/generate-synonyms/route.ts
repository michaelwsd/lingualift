import { NextResponse } from "next/server";
import { generateSynonyms } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { words } = await request.json();
    const groups = await generateSynonyms(words);
    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Synonyms error:", error);
    return NextResponse.json({ error: "Failed to generate synonyms" }, { status: 500 });
  }
}
