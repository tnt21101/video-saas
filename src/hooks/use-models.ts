"use client";

import { useState, useEffect } from "react";
import type { VideoModelConfig } from "@/types/video-models";

type ClientModel = Omit<VideoModelConfig, "buildPayload">;

export function useModels() {
  const [models, setModels] = useState<ClientModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        setModels(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { models, loading };
}
