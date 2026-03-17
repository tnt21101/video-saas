import { NextResponse } from "next/server";
import { requireUser } from "@/lib/dal";
import { distributeVideo, type Platform } from "@/lib/services/distribute";

export async function POST(request: Request) {
  try {
    await requireUser();
    const { videoUrl, caption, hashtags, platforms, title } =
      await request.json();

    if (!videoUrl || !platforms?.length) {
      return NextResponse.json(
        { error: "Missing videoUrl or platforms" },
        { status: 400 }
      );
    }

    const results = await distributeVideo({
      videoUrl,
      caption: caption || "",
      hashtags,
      platforms: platforms as Platform[],
      title,
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[distribute] Error:", error);
    const message =
      error instanceof Error ? error.message : "Distribution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
