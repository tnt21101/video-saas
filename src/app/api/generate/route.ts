import { NextResponse } from "next/server";
import { requireUser } from "@/lib/dal";
import { updateScene } from "@/lib/dal";
import { startGeneration } from "@/lib/services/kieai";
import type { GenerateRequest } from "@/types/api";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as GenerateRequest;

    const { videoPrompt, imageUrl, model, modelDefaults, sceneId, projectId } = body;

    if (!videoPrompt || !imageUrl || !model || !sceneId || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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

    // Update scene with task ID and status
    await updateScene(sceneId, {
      status: "generating",
      kie_task_id: taskId,
      model,
      model_params: modelDefaults || {},
    });

    return NextResponse.json({ taskId, sceneId });
  } catch (error) {
    console.error("[generate] Error:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
