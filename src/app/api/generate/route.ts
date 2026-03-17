import { NextResponse } from "next/server";
import { requireUser, updateScene, updateProject, deductCredits } from "@/lib/dal";
import { startGeneration } from "@/lib/services/kieai";
import { generateRequestSchema } from "@/lib/validation";

const CREDITS_PER_GENERATION = 5;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = generateRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { videoPrompt, imageUrl, model, modelDefaults, sceneId, projectId } = parsed.data;

    // Deduct credits before starting generation
    await deductCredits(
      user.organization_id,
      user.id,
      CREDITS_PER_GENERATION,
      sceneId,
      `Video generation: ${model}`
    );

    // Mark scene as generating BEFORE calling Kie.ai so webhook can always find it
    await updateScene(sceneId, {
      status: "generating",
      model,
      model_params: modelDefaults || {},
    });

    // Update project status to generating
    await updateProject(projectId, { status: "generating" });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const callbackUrl = `${baseUrl}/api/webhooks/kie`;

    // Start generation via Kie.ai
    const { taskId } = await startGeneration(
      model,
      videoPrompt,
      imageUrl,
      callbackUrl,
      modelDefaults || {}
    );

    // Store the task ID for polling/webhook lookup
    await updateScene(sceneId, { kie_task_id: taskId });

    return NextResponse.json({ taskId, sceneId });
  } catch (error) {
    console.error("[generate] Error:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
