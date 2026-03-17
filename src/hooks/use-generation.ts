"use client";

import { useCallback, useEffect, useRef } from "react";
import { useGenerationStore } from "@/stores/generation-store";
import { POLL_INTERVAL_MS, POLL_TIMEOUT_MS } from "@/lib/constants";

export function useGeneration(projectId: string) {
  const store = useGenerationStore();
  const pollIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const uploadImage = useCallback(
    async (file: File) => {
      store.setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");

        const { url } = await res.json();
        store.setImageUrl(url);
        return url;
      } finally {
        store.setIsUploading(false);
      }
    },
    [projectId, store]
  );

  const analyzeImage = useCallback(
    async (imageUrl: string) => {
      store.setIsAnalyzing(true);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        });
        if (!res.ok) throw new Error("Analysis failed");

        const analysis = await res.json();
        store.setImageAnalysis(analysis);
        return analysis;
      } finally {
        store.setIsAnalyzing(false);
      }
    },
    [store]
  );

  const generateScenes = useCallback(
    async (imageUrl: string, sceneCount: number = 3) => {
      store.setIsGeneratingScenes(true);
      try {
        const res = await fetch("/api/scenes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            projectId,
            sceneCount,
            model: store.selectedModel,
          }),
        });
        if (!res.ok) throw new Error("Scene generation failed");

        const { scenes, analysis } = await res.json();
        store.setScenes(scenes);
        store.setImageAnalysis(analysis);
        return scenes;
      } finally {
        store.setIsGeneratingScenes(false);
      }
    },
    [projectId, store]
  );

  const startGeneration = useCallback(
    async (sceneId: string, prompt: string, imageUrl: string) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoPrompt: prompt,
          imageUrl,
          model: store.selectedModel,
          modelDefaults: store.modelDefaults,
          sceneId,
          projectId,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const { taskId } = await res.json();
      store.updateScene(sceneId, { status: "generating", kie_task_id: taskId });
      startPolling(taskId, sceneId);
      return taskId;
    },
    [projectId, store]
  );

  const startPolling = useCallback(
    (taskId: string, sceneId: string) => {
      if (pollIntervals.current.has(taskId)) return;

      store.addPollingTaskId(taskId);
      const startTime = Date.now();

      const interval = setInterval(async () => {
        // Auto-fail if polling exceeds timeout
        if (Date.now() - startTime > POLL_TIMEOUT_MS) {
          store.updateScene(sceneId, {
            status: "failed",
            error_message: "Generation timed out after 10 minutes",
          });
          stopPolling(taskId);
          return;
        }

        try {
          const res = await fetch(`/api/poll/${taskId}`);
          if (!res.ok) return;

          const result = await res.json();

          if (result.status === "complete") {
            store.updateScene(sceneId, {
              status: "complete",
              clip_url: result.videoUrl,
            });
            stopPolling(taskId);
          } else if (result.status === "failed") {
            store.updateScene(sceneId, {
              status: "failed",
              error_message: result.error,
            });
            stopPolling(taskId);
          }
        } catch {
          // Continue polling on network errors
        }
      }, POLL_INTERVAL_MS);

      pollIntervals.current.set(taskId, interval);
    },
    [store]
  );

  const stopPolling = useCallback(
    (taskId: string) => {
      const interval = pollIntervals.current.get(taskId);
      if (interval) {
        clearInterval(interval);
        pollIntervals.current.delete(taskId);
      }
      store.removePollingTaskId(taskId);
    },
    [store]
  );

  // Clean up all polling on unmount
  useEffect(() => {
    return () => {
      pollIntervals.current.forEach((interval) => clearInterval(interval));
      pollIntervals.current.clear();
    };
  }, []);

  // Resume polling for in-progress scenes
  useEffect(() => {
    store.scenes.forEach((scene) => {
      if (
        scene.status === "generating" &&
        scene.kie_task_id &&
        !pollIntervals.current.has(scene.kie_task_id)
      ) {
        startPolling(scene.kie_task_id, scene.id);
      }
    });
  }, [store.scenes, startPolling]);

  return {
    uploadImage,
    analyzeImage,
    generateScenes,
    startGeneration,
  };
}
