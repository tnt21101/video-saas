"use client";

import { useCallback, useRef } from "react";
import { useGenerationStore } from "@/stores/generation-store";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  onUpload: (file: File) => Promise<string>;
}

export function ImageUpload({ onUpload }: ImageUploadProps) {
  const { imageUrl, isUploading } = useGenerationStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        await onUpload(file);
      }
    },
    [onUpload]
  );

  const handleSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await onUpload(file);
      }
    },
    [onUpload]
  );

  if (imageUrl) {
    return (
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardContent className="p-0 relative group">
          <img
            src={imageUrl}
            alt="Uploaded"
            className="w-full h-48 object-cover"
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm"
          >
            Replace image
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleSelect}
            className="hidden"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="bg-slate-900 border-slate-800 border-dashed cursor-pointer hover:border-slate-600 transition-colors"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400">Uploading...</p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
              <Upload className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drop an image or click to upload
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
