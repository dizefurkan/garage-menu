"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import animationData from "./hero-lottie.json";

/**
 * Decorative looping Lottie accent. Client-only (guards SSR window access).
 * Swap `hero-lottie.json` with any LottieFiles export to rebrand.
 */
export function LottieHero({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={className} aria-hidden />;

  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      className={className}
      aria-hidden
    />
  );
}
