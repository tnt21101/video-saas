import { NextResponse } from "next/server";
import { requireUser, getProject, updateProject } from "@/lib/dal";
import { startStitch } from "@/lib/services/stitch";

export async function POST(request: Request) {
  try {
    await requireUser();
    const { projectId, videoUrls, transition, transitionDurationMs } =
      await request.json();

    if (!projectId || !videoUrls?.length) {
      return NextResponse.json(
        { error: "Missing projectId or videoUrls" },
        { status: 400 }
      );
    }

    if (videoUrls.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 clips to stitch" },
        { status: 400 }
      );
    }

    // Update project status to stitching
    await updateProject(projectId, { status: "stitching" });

    const { requestId } = await startStitch({
      videoUrls,
      transition: transition || "crossfade",
      transitionDurationMs,
    });

    return NextResponse.json({ requestId, projectId });
  } catch (error) {
    console.error("[stitch] Error:", error);
    const message = error instanceof Error ? error.message : "Stitch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
