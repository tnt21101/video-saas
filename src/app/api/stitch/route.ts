import { NextResponse } from "next/server";
import { requireUser, updateProject } from "@/lib/dal";
import { startStitch } from "@/lib/services/stitch";
import { stitchRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireUser();
    const parsed = stitchRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { projectId, videoUrls, transition, transitionDurationMs } = parsed.data;

    // Update project status to stitching
    await updateProject(projectId, { status: "stitching" });

    try {
      const { requestId, videoUrl } = await startStitch({
        videoUrls,
        transition: transition || "crossfade",
        transitionDurationMs,
      });

      // Sync response — stitch completed immediately
      if (videoUrl) {
        await updateProject(projectId, { status: "complete", final_video_url: videoUrl });
        return NextResponse.json({ requestId, projectId, videoUrl, status: "complete" });
      }

      return NextResponse.json({ requestId, projectId });
    } catch (stitchError) {
      // Rollback project status on stitch failure
      await updateProject(projectId, { status: "failed" });
      throw stitchError;
    }
  } catch (error) {
    console.error("[stitch] Error:", error);
    const message = error instanceof Error ? error.message : "Stitch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
