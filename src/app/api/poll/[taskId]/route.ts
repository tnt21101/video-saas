import { NextResponse } from "next/server";
import { pollGeneration } from "@/lib/services/kieai";
import { getSceneByTaskId, updateScene } from "@/lib/dal";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const scene = await getSceneByTaskId(taskId);

    if (!scene) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    const result = await pollGeneration(scene.model, taskId);

    if (result.status === "complete" && result.videoUrl) {
      await updateScene(scene.id, {
        status: "complete",
        clip_url: result.videoUrl,
      });
    } else if (result.status === "failed") {
      await updateScene(scene.id, {
        status: "failed",
        error_message: result.error || "Generation failed",
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[poll] Error:", error);
    return NextResponse.json(
      { error: "Poll failed" },
      { status: 500 }
    );
  }
}
