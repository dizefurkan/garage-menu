"use client";

import { useScroll, useTransform, motion } from "motion/react";

/**
 * Monochrome Vercel-style backdrop: faint grid + a soft radial spotlight that
 * drifts on scroll. No color — uses neutral tokens only.
 */
export function GridBackground() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.35]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* faint grid */}
      <div
        className="absolute inset-0 opacity-[0.4] [background-size:44px_44px] dark:opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklch, var(--border) 60%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--border) 60%, transparent) 1px, transparent 1px)",
        }}
      />
      {/* radial fade so grid dissolves toward edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--background)_75%)]" />
      {/* drifting neutral spotlight */}
      <motion.div
        style={{ y, opacity }}
        className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--foreground)_8%,transparent),transparent_70%)] blur-2xl"
      />
    </div>
  );
}
