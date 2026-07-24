"use client";

import { useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useTransform,
} from "motion/react";
import { QrCode, Languages, LayoutGrid, type LucideIcon } from "lucide-react";

export interface ShowcaseStep {
  title: string;
  description: string;
}

const icons: LucideIcon[] = [QrCode, Languages, LayoutGrid];

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Apple-style pinned scroll section: the visual on the right stays fixed while
 * the steps on the left scroll; the active step drives which visual is shown and
 * a progress rail fills. Powered by motion's useScroll (reliable, no pinning).
 */
export function ScrollShowcase({
  eyebrow,
  heading,
  steps,
}: {
  eyebrow: string;
  heading: string;
  steps: ShowcaseStep[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(steps.length - 1, Math.floor(v * steps.length));
    setActive(idx);
  });

  const Icon = icons[active % icons.length];

  return (
    <section ref={ref} className="relative" style={{ height: `${steps.length * 90}vh` }}>
      <div className="sticky top-0 flex min-h-screen items-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left: steps */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {heading}
            </h2>

            <div className="mt-10 space-y-2">
              {steps.map((step, i) => {
                const isActive = i === active;
                return (
                  <div key={i} className="flex gap-4">
                    {/* progress rail */}
                    <div className="relative flex w-px justify-center bg-border">
                      {isActive && (
                        <motion.div
                          style={{ scaleY: railScale }}
                          className="absolute inset-0 w-px origin-top bg-foreground"
                        />
                      )}
                    </div>
                    <button
                      onClick={() =>
                        ref.current?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="flex-1 py-3 text-left"
                    >
                      <h3
                        className={`text-lg font-semibold transition-colors ${
                          isActive ? "text-foreground" : "text-muted-foreground/60"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <motion.p
                        animate={{
                          opacity: isActive ? 1 : 0,
                          height: isActive ? "auto" : 0,
                        }}
                        transition={{ duration: 0.3, ease }}
                        className="overflow-hidden text-sm text-muted-foreground"
                      >
                        <span className="block pt-1">{step.description}</span>
                      </motion.p>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: sticky visual that swaps per active step */}
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="absolute inset-0 [background-size:28px_28px] opacity-[0.35] [background-image:radial-gradient(color-mix(in_oklch,var(--border)_80%,transparent)_1px,transparent_1px)]" />
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }}
                transition={{ duration: 0.45, ease }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-6"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-foreground text-background">
                  <Icon className="h-11 w-11" strokeWidth={1.5} />
                </div>
                <div className="w-2/3 space-y-3">
                  <div className="mx-auto h-2.5 w-1/2 rounded-full bg-foreground/80" />
                  <div className="h-2 w-full rounded-full bg-muted" />
                  <div className="h-2 w-5/6 rounded-full bg-muted" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {String(active + 1).padStart(2, "0")} /{" "}
                  {String(steps.length).padStart(2, "0")}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
