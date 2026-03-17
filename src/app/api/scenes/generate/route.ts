import { NextResponse } from "next/server";
import { requireUser } from "@/lib/dal";
import { analyzeImage, generateSceneBreakdown } from "@/lib/services/claude";
import { createScene } from "@/lib/dal";
import { DEFAULT_MODEL_ID } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { imageUrl, projectId, sceneCount, model } = await request.json();

    if (!imageUrl || !projectId) {
      return NextResponse.json(
        { error: "Missing imageUrl or projectId" },
        { status: 400 }
      );
    }

    // Step 1: Analyze image with Claude
    const analysis = await analyzeImage(imageUrl);

    // Step 2: Generate scene breakdown
    const scenes = await generateSceneBreakdown(analysis, sceneCount || 3);

    // Step 3: Create scene records
    const createdScenes = await Promise.all(
      scenes.map((scene) =>
        createScene(projectId, user.organization_id, {
          scene_order: scene.scene_number,
          source_image_url: imageUrl,
          prompt: scene.video_prompt,
          model: model || DEFAULT_MODEL_ID,
          model_params: {},
        })
      )
    );

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
