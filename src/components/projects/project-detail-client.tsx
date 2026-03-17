"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import type { VideoProject, VideoScene } from "@/types/database";
import { useGenerationStore } from "@/stores/generation-store";
import { useGeneration } from "@/hooks/use-generation";
import { ModelSelector } from "@/components/generation/model-selector";
import { ImageUpload } from "@/components/generation/image-upload";
import { SceneTimeline } from "@/components/generation/scene-timeline";
import { StitchPanel } from "@/components/generation/stitch-panel";
import { DistributePanel } from "@/components/generation/distribute-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { MAX_CONCURRENT_GENERATIONS } from "@/lib/constants";

interface Props {
  project: VideoProject & { video_scenes: VideoScene[] };
}

export function ProjectDetailClient({ project }: Props) {
  const store = useGenerationStore();
  const gen = useGeneration(project.id);
  const [finalVideoUrl, setFinalVideoUrl] = useState(
    project.final_video_url || null
  );

  // Initialize scenes from server data
  useEffect(() => {
    store.setScenes(project.video_scenes);
    if (project.video_scenes.length > 0) {
      store.setImageUrl(project.video_scenes[0].source_image_url);
    }
    return () => store.reset();
  }, [project.id]);

  const handleUploadAndAnalyze = useCallback(
    async (file: File) => {
      const url = await gen.uploadImage(file);
      return url;
    },
    [gen]
  );

  const handleGenerateScenes = useCallback(async () => {
    if (!store.imageUrl) return;
    await gen.generateScenes(store.imageUrl, 3);
  }, [gen, store.imageUrl]);

  const handleGenerateOne = useCallback(
    async (sceneId: string, prompt: string, imageUrl: string) => {
      await gen.startGeneration(sceneId, prompt, imageUrl);
    },
    [gen]
  );

  const handleGenerateAll = useCallback(async () => {
    const pending = store.scenes.filter((s) => s.status === "pending");
    const generating = store.scenes.filter(
      (s) => s.status === "generating"
    ).length;
    const available = MAX_CONCURRENT_GENERATIONS - generating;

    const toGenerate = pending.slice(0, Math.max(0, available));

    await Promise.all(
      toGenerate.map((scene) =>
        gen.startGeneration(scene.id, scene.prompt, scene.source_image_url)
      )
    );
  }, [gen, store.scenes]);

  // Check if all scenes are complete (stitch-ready)
  const allScenesComplete =
    store.scenes.length >= 2 &&
    store.scenes.every((s) => s.status === "complete" && s.clip_url);

  const completedClipUrls = store.scenes
    .filter((s) => s.status === "complete" && s.clip_url)
    .map((s) => s.clip_url!);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-slate-400 mt-0.5">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Upload + Model + Stitch + Distribute */}
        <div className="space-y-4">
          <ImageUpload onUpload={handleUploadAndAnalyze} />
          <ModelSelector />

          {store.imageUrl && store.scenes.length === 0 && (
            <Button
              onClick={handleGenerateScenes}
              disabled={store.isGeneratingScenes || store.isAnalyzing}
              className="w-full"
            >
              {store.isGeneratingScenes || store.isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {store.isAnalyzing
                    ? "Analyzing image..."
                    : "Generating scenes..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze & Generate Scenes
                </>
              )}
            </Button>
          )}

          {/* Image Analysis Result */}
          {store.imageAnalysis && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Image Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400 space-y-1">
                <p>
                  Type:{" "}
                  <span className="text-white capitalize">
                    {store.imageAnalysis.type}
                  </span>
                </p>
                {store.imageAnalysis.type === "product" &&
                  store.imageAnalysis.product && (
                    <>
                      <p>
                        Product:{" "}
                        <span className="text-white">
                          {store.imageAnalysis.product.product_name}
                        </span>
                      </p>
                      <p>
                        Brand:{" "}
                        <span className="text-white">
                          {store.imageAnalysis.product.brand_name}
                        </span>
                      </p>
                    </>
                  )}
                {store.imageAnalysis.type === "character" &&
                  store.imageAnalysis.character && (
                    <>
                      <p>
                        Vibe:{" "}
                        <span className="text-white">
                          {store.imageAnalysis.character.vibe}
                        </span>
                      </p>
                    </>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Stitch Panel — shows when all scenes are complete */}
          {allScenesComplete && (
            <StitchPanel
              projectId={project.id}
              clipUrls={completedClipUrls}
              onStitchComplete={(url) => setFinalVideoUrl(url)}
            />
          )}

          {/* Distribute Panel — shows when we have a final video */}
          {finalVideoUrl && (
            <DistributePanel
              videoUrl={finalVideoUrl}
              projectId={project.id}
              projectName={project.name}
              sceneDescriptions={store.scenes.map((s) => s.prompt)}
            />
          )}
        </div>

        {/* Right column: Scene Timeline + Final Video */}
        <div className="lg:col-span-2 space-y-6">
          {store.scenes.length > 0 ? (
            <SceneTimeline
              scenes={store.scenes}
              onGenerate={handleGenerateOne}
              onGenerateAll={handleGenerateAll}
            />
          ) : (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="py-16 text-center">
                <Sparkles className="h-10 w-10 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Ready to create</h3>
                <p className="text-sm text-slate-400">
                  Upload an image, then click &quot;Analyze & Generate
                  Scenes&quot; to create your video storyboard
                </p>
              </CardContent>
            </Card>
          )}

          {/* Final stitched video */}
          {finalVideoUrl && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm">Final Video</CardTitle>
              </CardHeader>
              <CardContent>
                <video
                  src={finalVideoUrl}
                  controls
                  className="w-full rounded-lg bg-black"
                  preload="metadata"
                />
                <a
                  href={finalVideoUrl}
                  download
                  className="inline-flex items-center gap-2 mt-3 text-sm text-blue-400 hover:underline"
                >
                  Download video
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
