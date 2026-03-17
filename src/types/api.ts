// API request/response types — shared across all agents (READ-ONLY)

export interface ImageAnalysisProduct {
  brand_name: string;
  product_name: string;
  color_scheme: Array<{ hex: string; name: string }>;
  font_style: string;
  packaging: string;
  text_on_packaging: string;
  visual_description: string;
}

export interface ImageAnalysisCharacter {
  age_range: string;
  gender_presentation: string;
  build: string;
  hair: string;
  clothing: string;
  vibe: string;
  visual_description: string;
}

export interface ImageAnalysis {
  type: "product" | "character" | "both";
  product?: ImageAnalysisProduct;
  character?: ImageAnalysisCharacter;
  visual_description: string;
}

export interface SceneBreakdown {
  scene_number: number;
  role: "intro" | "continuation" | "closing";
  video_prompt: string;
  description: string;
}

export interface GenerateRequest {
  videoPrompt: string;
  imageUrl: string;
  model: string;
  modelDefaults: Record<string, unknown>;
  sceneId?: string;
  projectId?: string;
}

export interface GenerateResponse {
  taskId: string;
  sceneId: string;
}

export interface PollResponse {
  status: "pending" | "processing" | "complete" | "failed";
  videoUrl?: string | null;
  error?: string | null;
}

export interface KieCallbackPayload {
  taskId: string;
  status: string;
  output?: { video_url?: string };
  resultUrls?: string[];
  videoUrl?: string;
}

export interface SceneGenerateRequest {
  analysis: ImageAnalysis;
  script: string;
  pipeline: string;
  brand?: Record<string, unknown>;
  numScenes: number;
}

export interface SceneGenerateResponse {
  scenes: SceneBreakdown[];
}
