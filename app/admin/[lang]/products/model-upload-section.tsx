"use client";

import { useTranslations } from "next-intl";
import { ModelUpload } from "@/components/ui/model-upload";

interface ModelUploadSectionProps {
  glbUrl?: string | null;
  usdzUrl?: string | null;
  pendingGlbFile?: File | null;
  pendingUsdzFile?: File | null;
  onGlbFileSelect: (file: File | null) => void;
  onUsdzFileSelect: (file: File | null) => void;
  onGlbClear: () => void;
  onUsdzClear: () => void;
  disabled?: boolean;
}

export function ModelUploadSection({
  glbUrl,
  usdzUrl,
  pendingGlbFile,
  pendingUsdzFile,
  onGlbFileSelect,
  onUsdzFileSelect,
  onGlbClear,
  onUsdzClear,
  disabled = false,
}: ModelUploadSectionProps) {
  const t = useTranslations("admin");

  const sharedLabels = {
    uploading: t("modelUploading"),
    remove: t("modelRemove"),
    errorTooLarge: t("modelErrorTooLarge"),
    errorWrongType: t("modelErrorWrongType"),
    errorUploadFailed: t("modelErrorUploadFailed"),
  };

  const hasGlb = Boolean(glbUrl || pendingGlbFile);
  const hasUsdz = Boolean(usdzUrl || pendingUsdzFile);

  return (
    <div className="flex flex-col gap-4">
      <label className="block text-sm font-medium">{t("model3dTitle")}</label>

      <ModelUpload
        kind="glb"
        value={glbUrl}
        pendingFile={pendingGlbFile}
        onSelectFile={onGlbFileSelect}
        onClearValue={onGlbClear}
        disabled={disabled}
        labels={{
          ...sharedLabels,
          label: t("modelGlbLabel"),
          hint: t("modelGlbHint"),
        }}
      />

      <ModelUpload
        kind="usdz"
        value={usdzUrl}
        pendingFile={pendingUsdzFile}
        onSelectFile={onUsdzFileSelect}
        onClearValue={onUsdzClear}
        disabled={disabled}
        labels={{
          ...sharedLabels,
          label: t("modelUsdzLabel"),
          hint: t("modelUsdzHint"),
        }}
      />

      {hasUsdz && !hasGlb && (
        <p className="text-xs text-amber-600">{t("modelUsdzWithoutGlb")}</p>
      )}
    </div>
  );
}
