// Supabase table row types — shared across all agents (READ-ONLY)

export interface Organization {
  id: string;
  name: string;
  slug: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: "free" | "starter" | "pro" | "enterprise";
  credits_balance: number;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  role: "owner" | "admin" | "member";
  created_at: string;
}

export interface VideoProject {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: "draft" | "generating" | "stitching" | "complete" | "failed";
  transition_type: "crossfade" | "cut" | "fade_black";
  transition_duration_ms: number;
  final_video_url: string | null;
  total_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface VideoScene {
  id: string;
  project_id: string;
  organization_id: string;
  scene_order: number;
  source_image_url: string;
  prompt: string;
  model: string;
  model_params: Record<string, unknown>;
  status: "pending" | "generating" | "complete" | "failed";
  clip_url: string | null;
  clip_duration_seconds: number | null;
  kie_task_id: string | null;
  api_cost_cents: number | null;
  credits_used: number | null;
  error_message: string | null;
  image_analysis: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface VideoModel {
  id: string;
  provider: string;
  display_name: string;
  model_type: "image-to-video" | "text-to-video" | "video-to-video";
  max_duration_seconds: number;
  supported_resolutions: string[];
  supported_aspect_ratios: string[];
  cost_per_second_cents: number;
  speed_tier: "fast" | "standard" | "slow";
  has_audio: boolean;
  has_character_consistency: boolean;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  organization_id: string;
  user_id: string;
  type:
    | "purchase"
    | "subscription_grant"
    | "generation"
    | "refund"
    | "stitch";
  amount: number;
  balance_after: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface ApiCostLog {
  id: string;
  organization_id: string;
  scene_id: string;
  provider: string;
  model: string;
  cost_cents: number;
  duration_seconds: number | null;
  resolution: string | null;
  created_at: string;
}
