"use client";

import { useState } from "react";

type PublishStatus = "idle" | "publishing" | "done" | "error";

const STATUS_LABELS: Record<PublishStatus, string> = {
  idle: "idle",
  publishing: "publishing",
  done: "done",
  error: "error",
};

export default function PublishButton() {
  const [status, setStatus] = useState<PublishStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handlePublish() {
    setStatus("publishing");
    setMessage(null);

    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
        },
      });

      const responseBody = (await response.json().catch(() => null)) as {
        error?: string;
        success?: boolean;
      } | null;

      if (!response.ok || !responseBody?.success) {
        throw new Error(responseBody?.error ?? "Publish request failed");
      }

      setStatus("done");
      setMessage("Menu and image caches were revalidated.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
    }
  }

  return (
    <div className="rounded-3xl border border-[#890333]/15 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#890333]/70">
            Publish Status
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#890333]">
            {STATUS_LABELS[status]}
          </p>
        </div>

        <button
          className="rounded-full bg-[#890333] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6f0229] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === "publishing"}
          onClick={() => {
            void handlePublish();
          }}
          type="button"
        >
          {status === "publishing" ? "Publishing..." : "Publish"}
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-600">
        {message ??
          "Trigger publish to refresh the cached menu and image content."}
      </p>
    </div>
  );
}
