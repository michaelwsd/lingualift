import { NextResponse } from "next/server";
import { generateWorksheet } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { passageTopic, vocabWords } = await request.json();
    const data = await generateWorksheet(passageTopic, vocabWords);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Generate worksheet error:", error);
    return NextResponse.json({ error: "Failed to generate worksheet" }, { status: 500 });
  }
}
