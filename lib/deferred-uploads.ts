/**
 * Upload helpers for the product forms' deferred-upload flow.
 * Files are picked and validated in the form, but only sent to storage
 * when the user actually submits (Create/Update) - abandoning the form
 * leaves no orphaned files behind.
 */

import { supabase } from "@/lib/supabase";

export type ModelKind = "glb" | "usdz";

const MODEL_CONTENT_TYPES: Record<ModelKind, string> = {
  glb: "model/gltf-binary",
  usdz: "model/vnd.usdz+zip",
};

const IMAGE_MAX_DIMENSION = 1200;
const IMAGE_QUALITY = 0.9;

/**
 * Downscales to max 800px and re-encodes as WebP (JPEG fallback for
 * browsers without a WebP encoder) - the processing sharp used to do
 * server-side, moved into the browser.
 */
async function resizeImage(
  file: File
): Promise<{ blob: Blob; format: "webp" | "jpeg" }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Görsel işlenemedi");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, IMAGE_QUALITY)
    );

  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return { blob: webp, format: "webp" };

  const jpeg = await toBlob("image/jpeg");
  if (jpeg) return { blob: jpeg, format: "jpeg" };

  throw new Error("Görsel işlenemedi");
}

/**
 * Resizes/encodes the image in the browser, then uploads it directly to
 * Supabase Storage via a signed upload URL; returns its public URL.
 */
export async function uploadImageFile(file: File): Promise<string> {
  const { blob, format } = await resizeImage(file);

  const urlRes = await fetch("/api/admin/upload-image-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, size: blob.size }),
  });
  if (!urlRes.ok) {
    const data = await urlRes.json().catch(() => ({}));
    throw new Error(data.error || "Görsel yüklemesi başarısız");
  }
  const { path, token, publicUrl } = await urlRes.json();

  const { error } = await supabase.storage
    .from("product-images")
    .uploadToSignedUrl(path, token, blob, {
      contentType: `image/${format}`,
    });
  if (error) {
    console.error("Image upload error:", error);
    throw new Error(error.message || "Görsel yüklemesi başarısız");
  }

  return publicUrl as string;
}

/**
 * Uploads a 3D model directly to Supabase Storage via a signed upload URL
 * (bypasses the Vercel serverless body limit); returns its public URL.
 */
export async function uploadModelFile(
  kind: ModelKind,
  file: File
): Promise<string> {
  const urlRes = await fetch("/api/admin/upload-model-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, size: file.size }),
  });
  if (!urlRes.ok) {
    const data = await urlRes.json().catch(() => ({}));
    throw new Error(data.error || "Model upload failed");
  }
  const { path, token, publicUrl } = await urlRes.json();

  const { error } = await supabase.storage
    .from("product-models")
    .uploadToSignedUrl(path, token, file, {
      contentType: MODEL_CONTENT_TYPES[kind],
    });
  if (error) {
    console.error("Model upload error:", error);
    throw new Error(error.message || "Model upload failed");
  }

  return publicUrl as string;
}

/** Fire-and-forget removal of a previously saved model object. */
export function deleteModelByUrl(url: string): void {
  fetch(`/api/admin/delete-model?path=${encodeURIComponent(url)}`, {
    method: "DELETE",
  }).catch((err) => console.error("Model delete error:", err));
}
