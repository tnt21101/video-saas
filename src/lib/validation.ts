import { z } from "zod/v4";

export const generateRequestSchema = z.object({
  videoPrompt: z.string().min(1).max(2500),
  imageUrl: z.url(),
  model: z.string().min(1),
  modelDefaults: z.record(z.string(), z.unknown()).default({}),
  sceneId: z.uuid(),
  projectId: z.uuid(),
});

export const analyzeRequestSchema = z.object({
  imageUrl: z.url(),
});

export const scenesGenerateRequestSchema = z.object({
  imageUrl: z.url(),
  projectId: z.uuid(),
  sceneCount: z.number().int().min(1).max(6).optional().default(3),
  model: z.string().optional(),
});

export const stitchRequestSchema = z.object({
  projectId: z.uuid(),
  videoUrls: z.array(z.url()).min(2),
  transition: z.enum(["crossfade", "cut", "fade_black"]).optional().default("crossfade"),
  transitionDurationMs: z.number().int().min(0).max(5000).optional(),
});

export const distributeRequestSchema = z.object({
  videoUrl: z.url(),
  caption: z.string().default(""),
  hashtags: z.array(z.string()).optional(),
  platforms: z.array(z.enum(["tiktok", "instagram", "youtube"])).min(1),
  title: z.string().optional(),
  projectId: z.uuid().optional(),
});

export const captionsRequestSchema = z.object({
  projectName: z.string().min(1),
  sceneDescriptions: z.array(z.string()).default([]),
  platform: z.enum(["tiktok", "instagram", "youtube"]),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["draft", "generating", "stitching", "complete", "failed"]).optional(),
  final_video_url: z.string().optional(),
  total_duration_seconds: z.number().optional(),
});
