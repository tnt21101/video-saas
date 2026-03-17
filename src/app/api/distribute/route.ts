import { NextResponse } from "next/server";
import { requireUser, createDistributionLog } from "@/lib/dal";
import { distributeVideo, type Platform } from "@/lib/services/distribute";
import { distributeRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = distributeRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { videoUrl, caption, hashtags, platforms, title, projectId } = parsed.data;

    const results = await distributeVideo({
      videoUrl,
      caption,
      hashtags,
      platforms: platforms as Platform[],
      title,
    });

    // Persist distribution results to DB
    if (projectId) {
      try {
        await createDistributionLog(
          results.map((r) => ({
            project_id: projectId,
            organization_id: user.organization_id,
            platform: r.platform,
            video_url: videoUrl,
            caption: caption || undefined,
            hashtags: hashtags || undefined,
            title: title || undefined,
            post_id: r.postId || undefined,
            post_url: r.postUrl || undefined,
            success: r.success,
            error_message: r.error || undefined,
          }))
        );
      } catch (logError) {
        console.error("[distribute] Failed to persist distribution log:", logError);
        // Don't fail the request — distribution already succeeded
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[distribute] Error:", error);
    const message =
      error instanceof Error ? error.message : "Distribution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
