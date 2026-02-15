import { NextResponse } from "next/server";
import { suggestTopics } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { userInput, format } = await request.json();
    const topics = await suggestTopics(userInput, format);
    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Suggest topics error:", error);
    return NextResponse.json({ error: "Failed to suggest topics" }, { status: 500 });
  }
}
