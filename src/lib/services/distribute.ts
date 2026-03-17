const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY;
const AYRSHARE_URL = "https://app.ayrshare.com/api/post";

export type Platform = "tiktok" | "instagram" | "youtube";

export interface DistributeRequest {
  videoUrl: string;
  caption: string;
  hashtags?: string[];
  platforms: Platform[];
  title?: string; // YouTube title
}

export interface DistributeResult {
  platform: Platform;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export async function distributeVideo(
  req: DistributeRequest
): Promise<DistributeResult[]> {
  if (!AYRSHARE_API_KEY) throw new Error("AYRSHARE_API_KEY not configured");

  const hashtagString = req.hashtags?.length
    ? "\n\n" + req.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")
    : "";

  const body: Record<string, unknown> = {
    post: req.caption + hashtagString,
    platforms: req.platforms,
    mediaUrls: [req.videoUrl],
    isVideo: true,
  };

  if (req.title && req.platforms.includes("youtube")) {
    body.youTubeOptions = { title: req.title, visibility: "public" };
  }

  const res = await fetch(AYRSHARE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AYRSHARE_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ayrshare error (${res.status}): ${text}`);
  }

  const data = await res.json();

  // Ayrshare returns per-platform results
  if (Array.isArray(data)) {
    return data.map((item: Record<string, unknown>) => ({
      platform: item.platform as Platform,
      success: item.status === "success",
      postId: item.id as string,
      postUrl: item.postUrl as string,
      error: item.error as string | undefined,
    }));
  }

  // Single response format
  return req.platforms.map((platform) => ({
    platform,
    success: data.status === "success" || data.status === 200,
    postId: data.id,
    postUrl: data.postUrl,
    error: data.error,
  }));
}

export async function generateCaptions(
  projectName: string,
  sceneDescriptions: string[],
  platform: Platform
): Promise<{ caption: string; hashtags: string[] }> {
  // This uses the Anthropic SDK directly for caption generation
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const platformGuide: Record<Platform, string> = {
    tiktok: "Keep it punchy, max 300 chars. Use trending hashtag style. Hook in first line.",
    instagram: "Engaging caption, up to 2200 chars. Mix of descriptive and hashtag-friendly. Use line breaks.",
    youtube: "SEO-optimized description. Include key phrases. Can be longer and more detailed.",
  };

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Generate a social media caption and 5-8 relevant hashtags for a video called "${projectName}".

The video has these scenes: ${sceneDescriptions.join("; ")}

Platform: ${platform}
Guidelines: ${platformGuide[platform]}

Return JSON only:
{"caption": "the caption", "hashtags": ["tag1", "tag2"]}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}
