"use client";

import type { VideoScene } from "@/types/database";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { useState } from "react";

interface SceneCardProps {
  scene: VideoScene;
  index: number;
  onGenerate: (sceneId: string, prompt: string, imageUrl: string) => void;
  onUpdatePrompt?: (sceneId: string, prompt: string) => void;
}

export function SceneCard({
  scene,
  index,
  onGenerate,
  onUpdatePrompt,
}: SceneCardProps) {
  const [editedPrompt, setEditedPrompt] = useState(scene.prompt);

  const statusConfig: Record<
    string,
    { color: string; icon: React.ReactNode; label: string }
  > = {
    pending: { color: "bg-slate-700 text-slate-300", icon: null, label: "Ready" },
    generating: {
      color: "bg-yellow-500/20 text-yellow-400",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      label: "Generating",
    },
    complete: {
      color: "bg-green-500/20 text-green-400",
      icon: <Play className="h-3 w-3" />,
      label: "Complete",
    },
    failed: {
      color: "bg-red-500/20 text-red-400",
      icon: <AlertCircle className="h-3 w-3" />,
      label: "Failed",
    },
  };

  const status = statusConfig[scene.status] || statusConfig.pending;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <span className="text-sm font-medium">Scene {index + 1}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}
        >
          {status.icon}
          {status.label}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        {scene.status === "complete" && scene.clip_url ? (
          <video
            src={scene.clip_url}
            controls
            className="w-full rounded-lg bg-black"
            preload="metadata"
          />
        ) : scene.status === "generating" ? (
          <div className="h-32 bg-slate-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-yellow-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Generating video...</p>
            </div>
          </div>
        ) : null}

        <Textarea
          value={editedPrompt}
          onChange={(e) => {
            setEditedPrompt(e.target.value);
            onUpdatePrompt?.(scene.id, e.target.value);
          }}
          rows={3}
          className="bg-slate-800 border-slate-700 text-xs"
          placeholder="Scene prompt..."
          disabled={scene.status === "generating"}
        />

        {scene.error_message && (
          <p className="text-xs text-red-400">{scene.error_message}</p>
        )}

        {(scene.status === "pending" || scene.status === "failed") && (
          <Button
            size="sm"
            className="w-full"
            onClick={() =>
              onGenerate(scene.id, editedPrompt, scene.source_image_url)
            }
          >
            {scene.status === "failed" ? (
              <>
                <RotateCcw className="h-3 w-3 mr-1" /> Retry
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" /> Generate
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
