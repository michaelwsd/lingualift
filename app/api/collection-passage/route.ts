import { NextResponse } from "next/server";
import { generateCollectionPassage } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { words } = await request.json();
    const passage = await generateCollectionPassage(words);
    return NextResponse.json({ passage });
  } catch (error) {
    console.error("Collection passage error:", error);
    return NextResponse.json({ error: "Failed to generate collection passage" }, { status: 500 });
  }
}
