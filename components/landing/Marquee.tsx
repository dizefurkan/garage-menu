"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

/**
 * GSAP-driven infinite marquee (no ScrollTrigger — timeline loop, robust).
 * Renders two copies of the items and translates -50% forever.
 */
export function Marquee({ items }: { items: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        xPercent: -50,
        ease: "none",
        duration: 22,
        repeat: -1,
      });
    }, track);
    return () => ctx.revert();
  }, []);

  const row = [...items, ...items];

  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div ref={trackRef} className="flex w-max gap-3 pr-3">
        {row.map((item, i) => (
          <span
            key={i}
            className="whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
