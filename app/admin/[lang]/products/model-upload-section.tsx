"use client";

import { useTranslations } from "next-intl";
import { ModelUpload } from "@/components/ui/model-upload";

interface ModelUploadSectionProps {
  glbUrl?: string | null;
  usdzUrl?: string | null;
  onGlbChange: (url: string | null) => void;
  onUsdzChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ModelUploadSection({
  glbUrl,
  usdzUrl,
  onGlbChange,
  onUsdzChange,
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

  return (
    <div className="flex flex-col gap-4">
      <label className="block text-sm font-medium">{t("model3dTitle")}</label>

      <ModelUpload
        kind="glb"
        value={glbUrl}
        onChange={onGlbChange}
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
        onChange={onUsdzChange}
        disabled={disabled}
        labels={{
          ...sharedLabels,
          label: t("modelUsdzLabel"),
          hint: t("modelUsdzHint"),
        }}
      />

      {usdzUrl && !glbUrl && (
        <p className="text-xs text-amber-600">{t("modelUsdzWithoutGlb")}</p>
      )}
    </div>
  );
}
