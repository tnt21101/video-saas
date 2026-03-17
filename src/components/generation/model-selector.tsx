"use client";

import { useModels } from "@/hooks/use-models";
import { useGenerationStore } from "@/stores/generation-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ModelSelector() {
  const { models, loading } = useModels();
  const { selectedModel, setSelectedModel, modelDefaults, setModelDefaults } =
    useGenerationStore();

  const current = models.find((m) => m.id === selectedModel);

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-4">
          <div className="animate-pulse h-8 bg-slate-800 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Video Model</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedModel} onValueChange={(v) => v && setSelectedModel(v)}>
          <SelectTrigger className="bg-slate-800 border-slate-700">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <span>{model.name}</span>
                  <Badge
                    variant="outline"
                    className={
                      model.speed === "fast"
                        ? "border-green-500 text-green-400"
                        : model.speed === "standard"
                          ? "border-yellow-500 text-yellow-400"
                          : "border-red-500 text-red-400"
                    }
                  >
                    {model.speed}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {current && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              <span>{current.provider}</span>
              <span>|</span>
              <span>{current.resolution}</span>
              <span>|</span>
              <span>Max {current.maxDuration}s</span>
              {current.audio && (
                <>
                  <span>|</span>
                  <span className="text-green-400">Audio</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500">{current.notes}</p>

            {/* Dynamic config panel */}
            {current.configurableDefaults &&
              Object.entries(current.configurableDefaults).map(
                ([key, config]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-xs text-slate-400">
                      {config.label || key}
                    </Label>
                    {config.type === "toggle" ? (
                      <Switch
                        checked={
                          (modelDefaults[key] as boolean) ??
                          (config.default as boolean)
                        }
                        onCheckedChange={(checked) =>
                          setModelDefaults({ ...modelDefaults, [key]: checked })
                        }
                      />
                    ) : config.options ? (
                      <Select
                        value={
                          (modelDefaults[key] as string) ??
                          (config.default as string)
                        }
                        onValueChange={(val) =>
                          val && setModelDefaults({ ...modelDefaults, [key]: val })
                        }
                      >
                        <SelectTrigger className="w-28 h-8 bg-slate-800 border-slate-700 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {config.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                  </div>
                )
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
