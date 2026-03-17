import { NextResponse } from "next/server";
import { requireUser, createScene } from "@/lib/dal";
import { analyzeImage, generateSceneBreakdown } from "@/lib/services/claude";
import { DEFAULT_MODEL_ID } from "@/lib/constants";
import { scenesGenerateRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = scenesGenerateRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { imageUrl, projectId, sceneCount, model } = parsed.data;

    // Step 1: Analyze image with Claude
    const analysis = await analyzeImage(imageUrl);

    // Step 2: Generate scene breakdown
    const scenes = await generateSceneBreakdown(analysis, sceneCount);

    // Step 3: Create scene records sequentially to avoid partial failures
    const createdScenes = [];
    for (const scene of scenes) {
      const created = await createScene(projectId, user.organization_id, {
        scene_order: scene.scene_number,
        source_image_url: imageUrl,
        prompt: scene.video_prompt,
        model: model || DEFAULT_MODEL_ID,
        model_params: {},
      });
      createdScenes.push(created);
    }

    return NextResponse.json({
      analysis,
      scenes: createdScenes,
    });
  } catch (error) {
    console.error("[scenes/generate] Error:", error);
    const message = error instanceof Error ? error.message : "Scene generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
