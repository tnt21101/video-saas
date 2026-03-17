import Anthropic from "@anthropic-ai/sdk";
import type { ImageAnalysis, SceneBreakdown } from "@/types/api";

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

/** Strip markdown code fences from Claude's response */
function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

const IMAGE_ANALYSIS_PROMPT = `You are analyzing an image for AI video generation. Determine if this is primarily a PRODUCT image, a CHARACTER/PERSON image, or BOTH, then extract detailed attributes.

Return a JSON object with this exact structure:
{
  "type": "product" or "character" or "both",
  "visual_description": "overall detailed visual description of the entire image for video prompt generation",
  "product": { (include if type is "product" or "both")
    "brand_name": "detected or 'Unknown'",
    "product_name": "what the product is",
    "color_scheme": "dominant colors as a descriptive string",
    "font_style": "any text font style",
    "packaging": "packaging description",
    "text_on_packaging": "any visible text on the product or packaging",
    "visual_description": "detailed visual description for video prompt"
  },
  "character": { (include if type is "character" or "both")
    "age_range": "estimated age range",
    "gender_presentation": "perceived gender presentation",
    "build": "body type",
    "hair": "hair description",
    "clothing": "clothing description",
    "vibe": "overall mood/energy",
    "visual_description": "detailed visual description for video prompt"
  }
}

Return ONLY valid JSON, no markdown or explanation.`;

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  // Download image and convert to base64 (Claude API can't always fetch Supabase Storage URLs)
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);
  const buffer = await imgRes.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = imgRes.headers.get("content-type") || "image/jpeg";
  const mediaType = contentType.split(";")[0] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          { type: "text", text: IMAGE_ANALYSIS_PROMPT },
        ],
      },
    ],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(extractJson(raw)) as ImageAnalysis;
  } catch {
    throw new Error(`Image analysis returned invalid JSON: ${raw.slice(0, 300)}`);
  }
}

const SCENE_BREAKDOWN_PROMPT = `You are creating a multi-scene video storyboard from a single image analysis.

Given the image analysis below, create exactly {count} scenes for a cohesive video ad.

Rules:
- Scene 1 is always "intro" — establish the subject with a wow-factor reveal
- Middle scenes are "continuation" — show different angles, features, or actions
- Last scene is "closing" — end with a memorable moment or call to action
- Each prompt should be 1-3 sentences, cinematic and specific
- Reference the visual details from the analysis
- Prompts should describe motion, camera angles, and mood

Return a JSON array:
[
  {
    "scene_number": 1,
    "role": "intro",
    "video_prompt": "cinematic prompt for this scene",
    "description": "brief human-readable description"
  }
]

Return ONLY valid JSON array, no markdown.

Image analysis:
{analysis}`;

export async function generateSceneBreakdown(
  analysis: ImageAnalysis,
  sceneCount: number = 3
): Promise<SceneBreakdown[]> {
  const prompt = SCENE_BREAKDOWN_PROMPT.replace("{count}", String(sceneCount)).replace(
    "{analysis}",
    JSON.stringify(analysis, null, 2)
  );

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(extractJson(raw)) as SceneBreakdown[];
  } catch {
    throw new Error(`Scene breakdown returned invalid JSON: ${raw.slice(0, 300)}`);
  }
}
