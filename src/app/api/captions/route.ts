import { NextResponse } from "next/server";
import { requireUser } from "@/lib/dal";
import { generateCaptions, type Platform } from "@/lib/services/distribute";
import { captionsRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireUser();
    const parsed = captionsRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { projectName, sceneDescriptions, platform } = parsed.data;

    const result = await generateCaptions(
      projectName,
      sceneDescriptions,
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
