"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Film, Check } from "lucide-react";
import { POLL_INTERVAL_MS } from "@/lib/constants";

interface StitchPanelProps {
  projectId: string;
  clipUrls: string[];
  onStitchComplete: (videoUrl: string) => void;
}

export function StitchPanel({
  projectId,
  clipUrls,
  onStitchComplete,
}: StitchPanelProps) {
  const [transition, setTransition] = useState<string>("crossfade");
  const [isStitching, setIsStitching] = useState(false);
  const [stitchDone, setStitchDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleStitch() {
    setIsStitching(true);
    setError(null);

    try {
      const res = await fetch("/api/stitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          videoUrls: clipUrls,
          transition,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Stitch request failed");
      }

      const { requestId } = await res.json();

      // Start polling
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/stitch/poll/${requestId}`);
          const result = await pollRes.json();

          if (result.status === "complete" && result.videoUrl) {
            if (pollRef.current) clearInterval(pollRef.current);
            setIsStitching(false);
            setStitchDone(true);

            // Update project with final video URL
            await fetch(`/api/projects/${projectId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "complete",
                final_video_url: result.videoUrl,
              }),
            });

            onStitchComplete(result.videoUrl);
          } else if (result.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setIsStitching(false);
            setError(result.error || "Stitching failed");
          }
        } catch {
          // Continue polling on network errors
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setIsStitching(false);
      setError(err instanceof Error ? err.message : "Stitch failed");
    }
  }

  if (stitchDone) {
    return (
      <Card className="bg-green-500/10 border-green-500/20">
        <CardContent className="py-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-400" />
          <span className="text-sm text-green-400">Video stitched successfully</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Film className="h-4 w-4" />
          Stitch Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-slate-400">
          All {clipUrls.length} scenes are complete. Stitch them into one video.
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Transition</span>
          <Select value={transition} onValueChange={(v) => v && setTransition(v)}>
            <SelectTrigger className="w-32 h-8 bg-slate-800 border-slate-700 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="crossfade">Crossfade</SelectItem>
              <SelectItem value="cut">Cut</SelectItem>
              <SelectItem value="fade_black">Fade to Black</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <Button
          onClick={handleStitch}
          disabled={isStitching}
          className="w-full"
        >
          {isStitching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Stitching...
            </>
          ) : (
            <>
              <Film className="h-4 w-4 mr-2" />
              Stitch {clipUrls.length} Clips
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
