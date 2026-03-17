const FAL_API_KEY = process.env.FAL_AI_API_KEY;
const FAL_MERGE_URL = "https://queue.fal.run/fal-ai/ffmpeg-api/merge-videos";

export interface StitchRequest {
  videoUrls: string[];
  transition: "crossfade" | "cut" | "fade_black";
  transitionDurationMs?: number;
}

export interface StitchResult {
  status: "processing" | "complete" | "failed";
  videoUrl?: string;
  error?: string;
  requestId?: string;
}

export async function startStitch(req: StitchRequest): Promise<{ requestId: string; videoUrl?: string }> {
  if (!FAL_API_KEY) throw new Error("FAL_AI_API_KEY not configured");
  if (req.videoUrls.length < 2) throw new Error("Need at least 2 videos to stitch");

  const res = await fetch(FAL_MERGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${FAL_API_KEY}`,
    },
    body: JSON.stringify({
      video_urls: req.videoUrls,
      transition: req.transition,
      transition_duration: (req.transitionDurationMs || 500) / 1000,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai stitch error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const requestId = data.request_id || data.requestId;
  if (!requestId) {
    // Synchronous response — video is ready immediately
    const videoUrl = data.video?.url || data.output?.url || data.url;
    if (videoUrl) {
      return { requestId: `sync_${Date.now()}`, videoUrl };
    }
    throw new Error(`No request_id in fal.ai response: ${JSON.stringify(data)}`);
  }

  return { requestId };
}

export async function pollStitch(requestId: string, syncVideoUrl?: string): Promise<StitchResult> {
  if (!FAL_API_KEY) throw new Error("FAL_AI_API_KEY not configured");

  // Sync results — video URL was returned immediately by startStitch
  if (requestId.startsWith("sync_")) {
    return { status: "complete", videoUrl: syncVideoUrl };
  }

  const statusUrl = `https://queue.fal.run/fal-ai/ffmpeg-api/merge-videos/requests/${requestId}/status`;
  const res = await fetch(statusUrl, {
    headers: { Authorization: `Key ${FAL_API_KEY}` },
  });

  if (!res.ok) {
    return { status: "failed", error: `Poll failed (${res.status})` };
  }

  const data = await res.json();

  if (data.status === "COMPLETED") {
    // Fetch the actual result
    const resultUrl = `https://queue.fal.run/fal-ai/ffmpeg-api/merge-videos/requests/${requestId}`;
    const resultRes = await fetch(resultUrl, {
      headers: { Authorization: `Key ${FAL_API_KEY}` },
    });
    if (!resultRes.ok) {
      return { status: "failed", error: `Result fetch failed (${resultRes.status})` };
    }
    const result = await resultRes.json();
    const videoUrl = result.video?.url || result.output?.url || result.url;
    return { status: "complete", videoUrl };
  }

  if (data.status === "FAILED") {
    return { status: "failed", error: data.error || "Stitch failed" };
  }

  return { status: "processing", requestId };
}
