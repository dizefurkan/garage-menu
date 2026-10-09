"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One-line text that ping-pongs to reveal itself when it does not fit:
 * pause at the start, glide to the end, pause, glide back. Text that fits
 * stays still. Reduced-motion users get a plain ellipsis (see globals.css).
 */
export function MarqueeText({ children }: { children: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (!box.current || !text.current) return;
      setShift(Math.max(0, text.current.scrollWidth - box.current.clientWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, [children]);

  return (
    <span ref={box} className="block min-w-0 overflow-hidden whitespace-nowrap">
      <span
        ref={text}
        className={shift > 0 ? "crumb-marquee" : "inline-block"}
        style={
          shift > 0
            ? ({
                "--crumb-shift": `${shift}px`,
                // ~25px/s glide, never faster than a 3s round trip
                "--crumb-dur": `${Math.max(3, shift / 25 / 0.7)}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {children}
      </span>
    </span>
  );
}
