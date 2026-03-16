// Video model configuration types — shared across all agents (READ-ONLY)

export interface ModelConfigurableDefault {
  type: "select" | "toggle";
  options?: string[];
  default: string | boolean;
  label?: string;
}

export interface VideoModelConfig {
  id: string;
  provider: string;
  name: string;
  type: "image-to-video";
  maxDuration: number;
  resolution: string;
  aspectRatio: string;
  speed: "fast" | "standard" | "slow";
  audio: boolean;
  notes: string;
  apiEndpoint: string;
  pollEndpoint: string | null;
  buildPayload: (
    prompt: string,
    imageUrl: string,
    callBackUrl: string,
    defaults: Record<string, unknown>
  ) => Record<string, unknown>;
  configurableDefaults: Record<string, ModelConfigurableDefault>;
}

/**
 * The 3 core video models for Phase 1.
 * Each has a DIFFERENT Kie.ai API shape — this is critical.
 *
 * | Model         | Endpoint                    | Image field       | Duration field        |
 * |---------------|-----------------------------|-------------------|-----------------------|
 * | Seedance      | /api/v1/jobs/createTask      | input.input_urls  | input.duration        |
 * | Sora 2        | /api/v1/jobs/createTask      | input.image_urls  | input.n_frames        |
 * | Veo 3.1 Fast  | /api/v1/veo/generate         | top-level imageUrls | N/A (auto ~8s)      |
 */
export const VIDEO_MODELS: VideoModelConfig[] = [
  {
    id: "seedance-1.5-pro",
    provider: "Bytedance",
    name: "Seedance 1.5 Pro",
    type: "image-to-video",
    maxDuration: 12,
    resolution: "720p",
    aspectRatio: "9:16",
    speed: "standard",
    audio: true,
    notes: "Cinematic quality, native audio, great character acting",
    apiEndpoint: "https://api.kie.ai/api/v1/jobs/createTask",
    pollEndpoint: "https://api.kie.ai/api/v1/jobs/getTaskDetail",
    buildPayload: (
      prompt: string,
      imageUrl: string,
      callBackUrl: string,
      defaults: Record<string, unknown>
    ) => ({
      model: "bytedance/seedance-1.5-pro",
      callBackUrl,
      input: {
        prompt: prompt.substring(0, 2500),
        input_urls: [imageUrl],
        aspect_ratio: (defaults.aspect_ratio as string) || "9:16",
        resolution: (defaults.resolution as string) || "720p",
        duration: String(defaults.duration || 12),
        fixed_lens: (defaults.fixed_lens as boolean) || false,
        generate_audio:
          defaults.generate_audio !== undefined
            ? defaults.generate_audio
            : true,
      },
    }),
    configurableDefaults: {
      aspect_ratio: {
        type: "select",
        options: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"],
        default: "9:16",
      },
      resolution: {
        type: "select",
        options: ["480p", "720p"],
        default: "720p",
      },
      duration: {
        type: "select",
        options: ["4", "8", "12"],
        default: "12",
        label: "Duration (seconds)",
      },
      fixed_lens: {
        type: "toggle",
        default: false,
        label: "Lock camera",
      },
      generate_audio: {
        type: "toggle",
        default: true,
        label: "Generate audio",
      },
    },
  },
  {
    id: "sora-2-image-to-video",
    provider: "Sora 2",
    name: "Sora 2 I2V",
    type: "image-to-video",
    maxDuration: 15,
    resolution: "1080p",
    aspectRatio: "portrait",
    speed: "standard",
    audio: true,
    notes: "Best prompt accuracy, strong physics, portrait mode",
    apiEndpoint: "https://api.kie.ai/api/v1/jobs/createTask",
    pollEndpoint: "https://api.kie.ai/api/v1/jobs/getTaskDetail",
    buildPayload: (
      prompt: string,
      imageUrl: string,
      callBackUrl: string,
      defaults: Record<string, unknown>
    ) => ({
      model: "sora-2-image-to-video",
      callBackUrl,
      input: {
        prompt: prompt.substring(0, 2500),
        image_urls: [imageUrl],
        aspect_ratio: (defaults.aspect_ratio as string) || "portrait",
        n_frames: String(defaults.n_frames || 15),
        remove_watermark: true,
        upload_method: "s3",
      },
    }),
    configurableDefaults: {
      aspect_ratio: {
        type: "select",
        options: ["portrait", "landscape", "square"],
        default: "portrait",
      },
      n_frames: {
        type: "select",
        options: ["5", "10", "15"],
        default: "15",
        label: "Duration (seconds)",
      },
      remove_watermark: {
        type: "toggle",
        default: true,
        label: "Remove watermark",
      },
    },
  },
  {
    id: "veo3_fast",
    provider: "Veo",
    name: "Veo 3.1 Fast",
    type: "image-to-video",
    maxDuration: 8,
    resolution: "720p",
    aspectRatio: "9:16",
    speed: "fast",
    audio: true,
    notes: "Best audio + lip sync, fastest turnaround, proven in production",
    apiEndpoint: "https://api.kie.ai/api/v1/veo/generate",
    pollEndpoint: null, // Veo uses callback only
    buildPayload: (
      prompt: string,
      imageUrl: string,
      callBackUrl: string,
      defaults: Record<string, unknown>
    ) => ({
      prompt: prompt.substring(0, 2500),
      imageUrls: [imageUrl],
      model: "veo3_fast",
      watermark: "",
      callBackUrl,
      aspect_ratio: (defaults.aspect_ratio as string) || "9:16",
      enableFallback: false,
      enableTranslation: true,
      generationType: "REFERENCE_2_VIDEO",
    }),
    configurableDefaults: {
      aspect_ratio: {
        type: "select",
        options: ["16:9", "9:16"],
        default: "9:16",
      },
    },
  },
];
