"use client";

import type { VideoScene } from "@/types/database";
import { SceneCard } from "./scene-card";

interface SceneTimelineProps {
  scenes: VideoScene[];
  onGenerate: (sceneId: string, prompt: string, imageUrl: string) => void;
  onGenerateAll: () => void;
}

export function SceneTimeline({
  scenes,
  onGenerate,
  onGenerateAll,
}: SceneTimelineProps) {
  if (scenes.length === 0) return null;

  const pendingCount = scenes.filter((s) => s.status === "pending").length;
  const completeCount = scenes.filter((s) => s.status === "complete").length;
  const generatingCount = scenes.filter(
    (s) => s.status === "generating"
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium">
            Scenes ({completeCount}/{scenes.length} complete)
          </h3>
          {generatingCount > 0 && (
            <span className="text-xs text-yellow-400">
              {generatingCount} generating...
            </span>
          )}
        </div>
        {pendingCount > 0 && (
          <button
            onClick={onGenerateAll}
            className="text-xs text-blue-400 hover:underline"
          >
            Generate all ({pendingCount})
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-500"
          style={{
            width: `${scenes.length > 0 ? (completeCount / scenes.length) * 100 : 0}%`,
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes.map((scene, i) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            index={i}
            onGenerate={onGenerate}
          />
        ))}
      </div>
    </div>
  );
}
