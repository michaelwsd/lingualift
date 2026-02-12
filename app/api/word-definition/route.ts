import { NextResponse } from "next/server";
import { getWordDefinition } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { word } = await request.json();
    const definition = await getWordDefinition(word);
    return NextResponse.json({ definition });
  } catch (error) {
    console.error("Word definition error:", error);
    return NextResponse.json({ error: "Failed to get definition" }, { status: 500 });
  }
}
