"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Box, Trash2, Upload } from "lucide-react";
import type { ModelKind } from "@/lib/deferred-uploads";

export type { ModelKind };

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
  /** Already-saved model URL (edit form) */
  value?: string | null;
  /** Locally picked file waiting for form submit */
  pendingFile?: File | null;
  /**
   * Called with the picked (validated) file, or null when cleared.
   * No upload happens here - the parent uploads on form submit.
   */
  onSelectFile: (file: File | null) => void;
  /** Called when the user removes an already-saved model URL */
  onClearValue: () => void;
  disabled?: boolean;
  labels: ModelUploadLabels;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB, matches bucket limit

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
  pendingFile,
  onSelectFile,
  onClearValue,
  disabled,
  labels,
}: ModelUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError(null);

    if (!file.name.toLowerCase().endsWith(`.${kind}`)) {
      setError(labels.errorWrongType);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`${labels.errorTooLarge} (${formatFileSize(file.size)})`);
      return;
    }

    onSelectFile(file);
  };

  const handleRemove = () => {
    setError(null);
    if (pendingFile) {
      onSelectFile(null);
    } else if (value) {
      onClearValue();
    }
  };

  const displayName = pendingFile
    ? `${pendingFile.name} (${formatFileSize(pendingFile.size)})`
    : value
      ? fileNameFromUrl(value)
      : null;

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium">{labels.label}</p>
        <p className="text-xs text-muted-foreground">{labels.hint}</p>
      </div>

      {displayName ? (
        <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2">
          <Box className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm">{displayName}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            aria-label={labels.remove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-fit"
        >
          <Upload className="mr-2 h-4 w-4" />
          {labels.label} (.{kind})
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
          e.target.value = "";
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
