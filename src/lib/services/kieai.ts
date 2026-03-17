import { VIDEO_MODELS, type VideoModelConfig } from "@/types/video-models";
import type { PollResponse } from "@/types/api";

const KIEAI_API_KEY = process.env.KIEAI_API_KEY;

function getModel(modelId: string): VideoModelConfig {
  const model = VIDEO_MODELS.find((m) => m.id === modelId);
  if (!model) throw new Error(`Unknown model: ${modelId}`);
  return model;
}

export async function startGeneration(
  modelId: string,
  prompt: string,
  imageUrl: string,
  callbackUrl: string,
  modelDefaults: Record<string, unknown> = {}
): Promise<{ taskId: string }> {
  const model = getModel(modelId);
  const payload = model.buildPayload(prompt, imageUrl, callbackUrl, modelDefaults);

  const res = await fetch(model.apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KIEAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kie.ai API error (${res.status}): ${text}`);
  }

  const data = await res.json();

  // Different models return taskId in different shapes
  const taskId = data.data?.taskId || data.taskId || data.id;
  if (!taskId) {
    throw new Error(`No taskId in Kie.ai response: ${JSON.stringify(data)}`);
  }

  return { taskId };
}

export async function pollGeneration(
  modelId: string,
  taskId: string
): Promise<PollResponse> {
  const model = getModel(modelId);

  // Veo uses callback only — no polling endpoint
  if (!model.pollEndpoint) {
    return { status: "processing" };
  }

  const url = `${model.pollEndpoint}?taskId=${encodeURIComponent(taskId)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${KIEAI_API_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kie.ai poll error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const task = data.data || data;

  if (task.status === "completed" || task.status === "SUCCESS") {
    const videoUrl =
      task.output?.video_url ||
      task.output?.url ||
      task.video_url ||
      task.url;
    return { status: "complete", videoUrl };
  }

  if (task.status === "failed" || task.status === "FAILED") {
    return {
      status: "failed",
      error: task.error || task.message || "Generation failed",
    };
  }

  return { status: "processing" };
}
