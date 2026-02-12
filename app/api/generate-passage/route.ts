import { NextResponse } from "next/server";
import { generatePassageContent } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const config = await request.json();
    const result = await generatePassageContent(config);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate passage error:", error);
    return NextResponse.json({ error: "Failed to generate passage" }, { status: 500 });
  }
}
