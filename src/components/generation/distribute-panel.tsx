"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles, Check, AlertCircle } from "lucide-react";

interface DistributePanelProps {
  videoUrl: string;
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
  projectName,
  sceneDescriptions,
}: DistributePanelProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(
    new Set()
  );
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
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
  }

  async function handleGenerateCaption() {
    if (selectedPlatforms.size === 0) return;
    setIsGeneratingCaption(true);
    setError(null);

    try {
      const platform = Array.from(selectedPlatforms)[0]; // Use first selected platform's style
      const res = await fetch("/api/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName,
          sceneDescriptions,
          platform,
        }),
      });

      if (!res.ok) throw new Error("Caption generation failed");
      const data = await res.json();
      setCaption(data.caption);
      setHashtags(data.hashtags || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate caption");
    } finally {
      setIsGeneratingCaption(false);
    }
  }

  async function handleDistribute() {
    if (selectedPlatforms.size === 0 || !caption) return;
    setIsPosting(true);
    setError(null);

    try {
      const res = await fetch("/api/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl,
          caption,
          hashtags,
          platforms: Array.from(selectedPlatforms),
          title: projectName,
        }),
      });

      if (!res.ok) throw new Error("Distribution failed");
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Distribution failed");
    } finally {
      setIsPosting(false);
    }
  }

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

        {/* Caption */}
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
              Auto-generate
            </button>
          </div>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="Write a caption or auto-generate one..."
            className="bg-slate-800 border-slate-700 text-xs"
          />
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hashtags.map((tag) => (
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
            disabled={isPosting || selectedPlatforms.size === 0 || !caption}
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
