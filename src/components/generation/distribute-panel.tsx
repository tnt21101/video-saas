"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles, Check, AlertCircle } from "lucide-react";

interface DistributePanelProps {
  videoUrl: string;
  projectId: string;
  projectName: string;
  sceneDescriptions: string[];
}

type Platform = "tiktok" | "instagram" | "youtube";

const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: "tiktok", label: "TikTok", color: "bg-pink-500/20 text-pink-400" },
  { id: "instagram", label: "Instagram", color: "bg-purple-500/20 text-purple-400" },
  { id: "youtube", label: "YouTube", color: "bg-red-500/20 text-red-400" },
];

export function DistributePanel({
  videoUrl,
  projectId,
  projectName,
  sceneDescriptions,
}: DistributePanelProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(
    new Set()
  );
  const [captionsByPlatform, setCaptionsByPlatform] = useState<
    Map<Platform, { caption: string; hashtags: string[] }>
  >(new Map());
  const [activePlatformTab, setActivePlatformTab] = useState<Platform>("tiktok");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [results, setResults] = useState<
    { platform: string; success: boolean; error?: string }[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  function togglePlatform(platform: Platform) {
    const next = new Set(selectedPlatforms);
    if (next.has(platform)) {
      next.delete(platform);
    } else {
      next.add(platform);
    }
    setSelectedPlatforms(next);
    if (next.has(platform)) {
      setActivePlatformTab(platform);
    }
  }

  const currentCaption = captionsByPlatform.get(activePlatformTab);

  function updateCaption(platform: Platform, caption: string) {
    const next = new Map(captionsByPlatform);
    const existing = next.get(platform) || { caption: "", hashtags: [] };
    next.set(platform, { ...existing, caption });
    setCaptionsByPlatform(next);
  }

  async function handleGenerateCaption() {
    if (selectedPlatforms.size === 0) return;
    setIsGeneratingCaption(true);
    setError(null);

    try {
      // Generate a caption for each selected platform
      const next = new Map(captionsByPlatform);
      for (const platform of selectedPlatforms) {
        const res = await fetch("/api/captions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectName,
            sceneDescriptions,
            platform,
          }),
        });

        if (!res.ok) throw new Error(`Caption generation failed for ${platform}`);
        const data = await res.json();
        next.set(platform, { caption: data.caption, hashtags: data.hashtags || [] });
      }
      setCaptionsByPlatform(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate caption");
    } finally {
      setIsGeneratingCaption(false);
    }
  }

  async function handleDistribute() {
    if (selectedPlatforms.size === 0) return;
    setIsPosting(true);
    setError(null);

    try {
      // Check all selected platforms have captions
      for (const platform of selectedPlatforms) {
        if (!captionsByPlatform.get(platform)?.caption) {
          throw new Error(`Missing caption for ${platform}. Generate captions first.`);
        }
      }

      // Post to each platform with its own caption
      const allResults: { platform: string; success: boolean; error?: string }[] = [];

      for (const platform of selectedPlatforms) {
        const platformData = captionsByPlatform.get(platform)!;
        const res = await fetch("/api/distribute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl,
            caption: platformData.caption,
            hashtags: platformData.hashtags,
            platforms: [platform],
            title: projectName,
            projectId,
          }),
        });

        if (!res.ok) {
          allResults.push({ platform, success: false, error: "Request failed" });
          continue;
        }
        const data = await res.json();
        allResults.push(...(data.results || [{ platform, success: false, error: "No results" }]));
      }

      setResults(allResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Distribution failed");
    } finally {
      setIsPosting(false);
    }
  }

  const selectedArray = Array.from(selectedPlatforms);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Send className="h-4 w-4" />
          Distribute
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform selection */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-400">Platforms</Label>
          <div className="flex gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedPlatforms.has(p.id)
                    ? p.color + " ring-1 ring-current"
                    : "bg-slate-800 text-slate-500 hover:text-slate-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Caption — tabbed per platform */}
        {selectedPlatforms.size > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-400">Caption</Label>
              <button
                onClick={handleGenerateCaption}
                disabled={isGeneratingCaption || selectedPlatforms.size === 0}
                className="text-xs text-blue-400 hover:underline disabled:opacity-50 flex items-center gap-1"
              >
                {isGeneratingCaption ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Auto-generate {selectedPlatforms.size > 1 ? "all" : ""}
              </button>
            </div>

            {/* Platform tabs for captions */}
            {selectedPlatforms.size > 1 && (
              <div className="flex gap-1">
                {selectedArray.map((p) => (
                  <button
                    key={p}
                    onClick={() => setActivePlatformTab(p)}
                    className={`px-2 py-1 text-xs rounded ${
                      activePlatformTab === p
                        ? "bg-slate-700 text-slate-200"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {PLATFORMS.find((pl) => pl.id === p)?.label}
                  </button>
                ))}
              </div>
            )}

            <Textarea
              value={captionsByPlatform.get(activePlatformTab)?.caption || ""}
              onChange={(e) => updateCaption(activePlatformTab, e.target.value)}
              rows={3}
              placeholder={`Write a caption for ${PLATFORMS.find((p) => p.id === activePlatformTab)?.label}...`}
              className="bg-slate-800 border-slate-700 text-xs"
            />
            {(currentCaption?.hashtags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1">
                {currentCaption!.hashtags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs border-slate-700"
                  >
                    #{tag.replace(/^#/, "")}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Results */}
        {results && (
          <div className="space-y-1">
            {results.map((r) => (
              <div
                key={r.platform}
                className="flex items-center gap-2 text-xs"
              >
                {r.success ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-red-400" />
                )}
                <span className={r.success ? "text-green-400" : "text-red-400"}>
                  {r.platform}: {r.success ? "Posted" : r.error || "Failed"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Post button */}
        {!results && (
          <Button
            onClick={handleDistribute}
            disabled={isPosting || selectedPlatforms.size === 0}
            className="w-full"
          >
            {isPosting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post to {selectedPlatforms.size} platform
                {selectedPlatforms.size !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
