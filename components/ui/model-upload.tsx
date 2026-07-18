"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Box, Loader, Trash2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type ModelKind = "glb" | "usdz";

interface ModelUploadLabels {
  label: string;
  hint: string;
  uploading: string;
  remove: string;
  errorTooLarge: string;
  errorWrongType: string;
  errorUploadFailed: string;
}

interface ModelUploadProps {
  kind: ModelKind;
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  labels: ModelUploadLabels;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB, matches bucket limit

const CONTENT_TYPES: Record<ModelKind, string> = {
  glb: "model/gltf-binary",
  usdz: "model/vnd.usdz+zip",
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const fileNameFromUrl = (url: string): string => {
  try {
    const segments = new URL(url).pathname.split("/");
    return decodeURIComponent(segments[segments.length - 1] || url);
  } catch {
    return url;
  }
};

export function ModelUpload({
  kind,
  value,
  onChange,
  disabled,
  labels,
}: ModelUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);

    if (!file.name.toLowerCase().endsWith(`.${kind}`)) {
      setError(labels.errorWrongType);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`${labels.errorTooLarge} (${formatFileSize(file.size)})`);
      return;
    }

    setLoading(true);
    try {
      // 1. Get a signed upload URL (auth + tenant path handled server-side)
      const urlRes = await fetch("/api/admin/upload-model-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, size: file.size }),
      });
      if (!urlRes.ok) {
        const data = await urlRes.json().catch(() => ({}));
        throw new Error(data.error || labels.errorUploadFailed);
      }
      const { path, token, publicUrl } = await urlRes.json();

      // 2. Upload directly to Supabase Storage (bypasses Vercel body limit)
      const { error: uploadError } = await supabase.storage
        .from("product-models")
        .uploadToSignedUrl(path, token, file, {
          contentType: CONTENT_TYPES[kind],
        });
      if (uploadError) {
        console.error("Model upload error:", uploadError);
        throw new Error(labels.errorUploadFailed);
      }

      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.errorUploadFailed);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    setLoading(true);
    setError(null);
    try {
      await fetch(`/api/admin/delete-model?path=${encodeURIComponent(value)}`, {
        method: "DELETE",
      });
    } catch (err) {
      // Object removal failure shouldn't block clearing the reference
      console.error("Model delete error:", err);
    } finally {
      onChange(null);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium">{labels.label}</p>
        <p className="text-xs text-muted-foreground">{labels.hint}</p>
      </div>

      {value ? (
        <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2">
          <Box className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm">
            {fileNameFromUrl(value)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || loading}
            aria-label={labels.remove}
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading}
          className="w-fit"
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              {labels.uploading}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {labels.label} (.{kind})
            </>
          )}
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={`.${kind}`}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
