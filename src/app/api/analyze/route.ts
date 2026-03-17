import { NextResponse } from "next/server";
import { requireUser } from "@/lib/dal";
import { analyzeImage } from "@/lib/services/claude";

export async function POST(request: Request) {
  try {
    await requireUser();
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing imageUrl" },
        { status: 400 }
      );
    }

    const analysis = await analyzeImage(imageUrl);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[analyze] Error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
