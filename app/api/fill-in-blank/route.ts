import { NextResponse } from "next/server";
import { generateFillInBlank } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { words } = await request.json();
    const result = await generateFillInBlank(words);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Fill-in-blank error:", error);
    return NextResponse.json({ error: "Failed to generate fill-in-blank exercise" }, { status: 500 });
  }
}
