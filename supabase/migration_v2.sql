-- ============================================================
-- VideoGen SaaS — Migration V2
-- Fixes: distribution logging, updated_at triggers, project status
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Distribution Log table — persists social publishing results
CREATE TABLE IF NOT EXISTS distribution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok','instagram','youtube')),
  video_url TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT[],
  title TEXT,
  post_id TEXT,
  post_url TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (matching existing dev-mode policy)
ALTER TABLE distribution_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON distribution_log FOR ALL USING (true) WITH CHECK (true);

-- 2. Auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_video_projects
  BEFORE UPDATE ON video_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_video_scenes
  BEFORE UPDATE ON video_scenes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
