import { createClient } from "@/lib/supabase/server";
import type {
  Organization,
  User,
  VideoProject,
  VideoScene,
  VideoModel,
  DistributionLog,
} from "@/types/database";

// ── Default dev user (no login required) ──────────────────────

const DEV_ORG: Organization = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "VideoGen Dev",
  slug: "videogen-dev",
  stripe_customer_id: null,
  stripe_subscription_id: null,
  plan: "free",
  credits_balance: 100,
  settings: {},
  created_at: new Date().toISOString(),
};

const DEV_USER: User & { organizations: Organization } = {
  id: "00000000-0000-0000-0000-000000000001",
  organization_id: DEV_ORG.id,
  email: "dev@videogen.local",
  role: "owner",
  created_at: new Date().toISOString(),
  organizations: DEV_ORG,
};

// ── Auth helpers ──────────────────────────────────────────────

export async function getCurrentUser() {
  const supabase = await createClient();

  // Try to get an existing org, or create a default one
  let { data: org } = await supabase
    .from("organizations")
    .select("*")
    .limit(1)
    .single();

  if (!org) {
    // Auto-create default org on first use
    const { data: newOrg, error } = await supabase
      .from("organizations")
      .insert({ name: "VideoGen Dev", slug: "videogen-dev" })
      .select()
      .single();
    if (error) {
      console.error("Failed to create default org:", error);
      return DEV_USER;
    }
    org = newOrg;
  }

  return {
    ...DEV_USER,
    organization_id: org.id,
    organizations: org as Organization,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  return user;
}

// ── Organizations ─────────────────────────────────────────────

export async function getOrganization(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();
  if (error) throw error;
  return data as Organization;
}

// ── Projects ──────────────────────────────────────────────────

export async function getProjects(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_projects")
    .select("*, video_scenes(count)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as (VideoProject & { video_scenes: { count: number }[] })[];
}

export async function getProject(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_projects")
    .select("*, video_scenes(*)")
    .eq("id", projectId)
    .order("scene_order", { referencedTable: "video_scenes", ascending: true })
    .single();
  if (error) throw error;
  return data as VideoProject & { video_scenes: VideoScene[] };
}

export async function createProject(
  orgId: string,
  userId: string,
  name: string,
  description?: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_projects")
    .insert({
      organization_id: orgId,
      user_id: userId,
      name,
      description: description || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as VideoProject;
}

export async function updateProject(
  projectId: string,
  updates: Partial<
    Pick<VideoProject, "name" | "status" | "final_video_url" | "total_duration_seconds">
  >
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single();
  if (error) throw error;
  return data as VideoProject;
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("video_projects")
    .delete()
    .eq("id", projectId);
  if (error) throw error;
}

// ── Scenes ────────────────────────────────────────────────────

export async function getScenes(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_scenes")
    .select("*")
    .eq("project_id", projectId)
    .order("scene_order", { ascending: true });
  if (error) throw error;
  return data as VideoScene[];
}

export async function createScene(
  projectId: string,
  orgId: string,
  scene: {
    scene_order: number;
    source_image_url: string;
    prompt: string;
    model: string;
    model_params?: Record<string, unknown>;
  }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_scenes")
    .insert({
      project_id: projectId,
      organization_id: orgId,
      ...scene,
    })
    .select()
    .single();
  if (error) throw error;
  return data as VideoScene;
}

export async function updateScene(
  sceneId: string,
  updates: Partial<
    Pick<
      VideoScene,
      | "status"
      | "clip_url"
      | "clip_duration_seconds"
      | "kie_task_id"
      | "error_message"
      | "prompt"
      | "model"
      | "model_params"
      | "image_analysis"
      | "api_cost_cents"
      | "credits_used"
    >
  >
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_scenes")
    .update(updates)
    .eq("id", sceneId)
    .select()
    .single();
  if (error) throw error;
  return data as VideoScene;
}

export async function deleteScene(sceneId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("video_scenes")
    .delete()
    .eq("id", sceneId);
  if (error) throw error;
}

export async function getSceneByTaskId(taskId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_scenes")
    .select("*")
    .eq("kie_task_id", taskId)
    .single();
  if (error) return null;
  return data as VideoScene;
}

// ── Video Models ──────────────────────────────────────────────

export async function getVideoModels() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_models")
    .select("*")
    .eq("is_active", true)
    .order("display_name");
  if (error) throw error;
  return data as VideoModel[];
}

// ── Credits ───────────────────────────────────────────────────

export async function deductCredits(
  orgId: string,
  userId: string,
  amount: number,
  referenceId: string,
  description: string
) {
  const supabase = await createClient();

  // Read current balance
  const org = await getOrganization(orgId);
  if (org.credits_balance < amount) {
    throw new Error("Insufficient credits");
  }

  const expectedBalance = org.credits_balance;
  const newBalance = expectedBalance - amount;

  // Optimistic lock: only update if balance hasn't changed since we read it
  const { data, error } = await supabase
    .from("organizations")
    .update({ credits_balance: newBalance })
    .eq("id", orgId)
    .eq("credits_balance", expectedBalance)
    .select("credits_balance")
    .single();

  if (error || !data) {
    throw new Error("Credit deduction failed — balance changed concurrently. Please retry.");
  }

  await supabase.from("credit_transactions").insert({
    organization_id: orgId,
    user_id: userId,
    type: "generation",
    amount: -amount,
    balance_after: newBalance,
    reference_id: referenceId,
    description,
  });

  return newBalance;
}

// ── Distribution Log ─────────────────────────────────────────

export async function createDistributionLog(
  entries: {
    project_id: string;
    organization_id: string;
    platform: "tiktok" | "instagram" | "youtube";
    video_url: string;
    caption?: string;
    hashtags?: string[];
    title?: string;
    post_id?: string;
    post_url?: string;
    success: boolean;
    error_message?: string;
  }[]
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("distribution_log")
    .insert(entries)
    .select();
  if (error) throw error;
  return data as DistributionLog[];
}

export async function getDistributionLog(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("distribution_log")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as DistributionLog[];
}
