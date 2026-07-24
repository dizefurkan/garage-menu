"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

interface CounterProps {
  /** e.g. "10K+", "99.9%", "24/7" — leading number is animated, suffix kept */
  value: string;
  className?: string;
}

/** Parses a display string into an animatable number + prefix/suffix. */
function parse(value: string) {
  const match = value.match(/^(\D*)([\d.]+)(.*)$/);
  if (!match) return { prefix: "", num: null as number | null, suffix: value };
  return { prefix: match[1], num: parseFloat(match[2]), suffix: match[3] };
}

export function Counter({ value, className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const { prefix, num, suffix } = parse(value);
  const decimals = num !== null && !Number.isInteger(num) ? 1 : 0;
  const [display, setDisplay] = useState(num === null ? value : `${prefix}0${suffix}`);

  useEffect(() => {
    if (!inView || num === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(`${prefix}${(num * eased).toFixed(decimals)}${suffix}`);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, num, prefix, suffix, decimals, value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
