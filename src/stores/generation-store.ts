import { create } from "zustand";
import type { VideoScene } from "@/types/database";
import type { ImageAnalysis } from "@/types/api";

interface GenerationState {
  scenes: VideoScene[];
  selectedModel: string;
  modelDefaults: Record<string, unknown>;
  imageUrl: string | null;
  imageAnalysis: ImageAnalysis | null;
  isUploading: boolean;
  isAnalyzing: boolean;
  isGeneratingScenes: boolean;
  pollingTaskIds: Set<string>;

  setScenes: (scenes: VideoScene[]) => void;
  updateScene: (sceneId: string, updates: Partial<VideoScene>) => void;
  setSelectedModel: (model: string) => void;
  setModelDefaults: (defaults: Record<string, unknown>) => void;
  setImageUrl: (url: string | null) => void;
  setImageAnalysis: (analysis: ImageAnalysis | null) => void;
  setIsUploading: (v: boolean) => void;
  setIsAnalyzing: (v: boolean) => void;
  setIsGeneratingScenes: (v: boolean) => void;
  addPollingTaskId: (taskId: string) => void;
  removePollingTaskId: (taskId: string) => void;
  reset: () => void;
}

const initialState = {
  scenes: [],
  selectedModel: "veo3_fast",
  modelDefaults: {},
  imageUrl: null,
  imageAnalysis: null,
  isUploading: false,
  isAnalyzing: false,
  isGeneratingScenes: false,
  pollingTaskIds: new Set<string>(),
};

export const useGenerationStore = create<GenerationState>((set) => ({
  ...initialState,

  setScenes: (scenes) => set({ scenes }),
  updateScene: (sceneId, updates) =>
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId ? { ...s, ...updates } : s
      ),
    })),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setModelDefaults: (defaults) => set({ modelDefaults: defaults }),
  setImageUrl: (url) => set({ imageUrl: url }),
  setImageAnalysis: (analysis) => set({ imageAnalysis: analysis }),
  setIsUploading: (v) => set({ isUploading: v }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  setIsGeneratingScenes: (v) => set({ isGeneratingScenes: v }),
  addPollingTaskId: (taskId) =>
    set((state) => {
      const next = new Set(state.pollingTaskIds);
      next.add(taskId);
      return { pollingTaskIds: next };
    }),
  removePollingTaskId: (taskId) =>
    set((state) => {
      const next = new Set(state.pollingTaskIds);
      next.delete(taskId);
      return { pollingTaskIds: next };
    }),
  reset: () => set(initialState),
}));
