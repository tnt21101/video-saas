import { NextResponse } from "next/server";
import { requireUser } from "@/lib/dal";
import { generateCaptions, type Platform } from "@/lib/services/distribute";

export async function POST(request: Request) {
  try {
    await requireUser();
    const { projectName, sceneDescriptions, platform } = await request.json();

    if (!projectName || !platform) {
      return NextResponse.json(
        { error: "Missing projectName or platform" },
        { status: 400 }
      );
    }

    const result = await generateCaptions(
      projectName,
      sceneDescriptions || [],
      platform as Platform
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[captions] Error:", error);
    const message =
      error instanceof Error ? error.message : "Caption generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
