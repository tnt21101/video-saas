-- ============================================================
-- VideoGen SaaS — Full Schema (Auth-Free Dev Mode)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','starter','pro','enterprise')),
  credits_balance INTEGER NOT NULL DEFAULT 100,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Video Projects (user_id is plain UUID, no auth FK)
CREATE TABLE IF NOT EXISTS video_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generating','stitching','complete','failed')),
  transition_type TEXT DEFAULT 'crossfade' CHECK (transition_type IN ('crossfade','cut','fade_black')),
  transition_duration_ms INTEGER DEFAULT 500,
  final_video_url TEXT,
  total_duration_seconds NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Video Scenes
CREATE TABLE IF NOT EXISTS video_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scene_order INTEGER NOT NULL,
  source_image_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  model_params JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','generating','complete','failed')),
  clip_url TEXT,
  clip_duration_seconds NUMERIC,
  kie_task_id TEXT,
  api_cost_cents INTEGER,
  credits_used INTEGER,
  error_message TEXT,
  image_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Video Models (config cache)
CREATE TABLE IF NOT EXISTS video_models (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  model_type TEXT NOT NULL DEFAULT 'image-to-video' CHECK (model_type IN ('image-to-video','text-to-video','video-to-video')),
  max_duration_seconds INTEGER NOT NULL,
  supported_resolutions TEXT[] DEFAULT '{}',
  supported_aspect_ratios TEXT[] DEFAULT '{}',
  cost_per_second_cents NUMERIC DEFAULT 0,
  speed_tier TEXT CHECK (speed_tier IN ('fast','standard','slow')),
  has_audio BOOLEAN DEFAULT false,
  has_character_consistency BOOLEAN DEFAULT false,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Credit Transactions (user_id is plain UUID, no auth FK)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID,
  type TEXT NOT NULL CHECK (type IN ('purchase','subscription_grant','generation','refund','stitch')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. API Cost Log
CREATE TABLE IF NOT EXISTS api_cost_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES video_scenes(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  duration_seconds NUMERIC,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security (permissive — dev mode, no auth)
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cost_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON video_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON video_scenes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON video_models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON credit_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON api_cost_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Seed Video Models
-- ============================================================

INSERT INTO video_models (id, provider, display_name, model_type, max_duration_seconds, supported_resolutions, supported_aspect_ratios, cost_per_second_cents, speed_tier, has_audio, has_character_consistency, description, is_active)
VALUES
  ('seedance-1.5-pro', 'Bytedance', 'Seedance 1.5 Pro', 'image-to-video', 12, ARRAY['480p','720p'], ARRAY['1:1','16:9','9:16','4:3','3:4','21:9'], 5, 'standard', true, false, 'Cinematic quality, native audio, great character acting', true),
  ('sora-2-image-to-video', 'Sora 2', 'Sora 2 I2V', 'image-to-video', 15, ARRAY['1080p'], ARRAY['portrait','landscape','square'], 8, 'standard', true, false, 'Best prompt accuracy, strong physics, portrait mode', true),
  ('veo3_fast', 'Veo', 'Veo 3.1 Fast', 'image-to-video', 8, ARRAY['720p'], ARRAY['16:9','9:16'], 3, 'fast', true, false, 'Best audio + lip sync, fastest turnaround, proven in production', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage: images bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');
