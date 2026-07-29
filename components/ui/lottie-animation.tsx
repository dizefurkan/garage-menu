"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// lottie-react touches `window` on import, and the animation JSON files are
// large (the landing hero one is 254 KB). Keeping both out of the initial
// bundle matters here: empty states render on pages that are otherwise cheap.
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export type LottieLoader = () => Promise<{ default: unknown }>;

interface LottieAnimationProps {
  /** Dynamic import of the animation JSON, e.g. `() => import("./foo.json")`. */
  load: LottieLoader;
  className?: string;
}

/**
 * Lazily-loaded, motion-safe Lottie player.
 *
 * Renders nothing when the animation is unavailable or the viewer prefers
 * reduced motion — callers are expected to show a static fallback alongside,
 * so an absent animation degrades rather than leaving a hole.
 */
export function LottieAnimation({ load, className }: LottieAnimationProps) {
  const [data, setData] = useState<unknown>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(query.matches);

    const handleChange = (event: MediaQueryListEvent) =>
      setPrefersReducedMotion(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Skip the network entirely when motion is reduced — no point paying for
    // a JSON payload we are not going to play.
    if (prefersReducedMotion) return;

    let cancelled = false;
    load()
      .then((module) => {
        if (!cancelled) setData(module.default);
      })
      .catch((error) => {
        console.error("[LottieAnimation] Failed to load animation:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [load, prefersReducedMotion]);

  if (prefersReducedMotion || !data) return null;

  return (
    <Lottie
      animationData={data}
      loop
      autoplay
      className={className}
      aria-hidden
    />
  );
}
