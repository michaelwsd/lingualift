import { NextResponse } from "next/server";
import { generateWordDetails } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { text, context } = await request.json();
    const details = await generateWordDetails(text, context);
    return NextResponse.json(details);
  } catch (error) {
    console.error("Word details error:", error);
    return NextResponse.json({ error: "Failed to get word details" }, { status: 500 });
  }
}
