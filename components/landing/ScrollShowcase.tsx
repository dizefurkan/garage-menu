"use client";

import { useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useTransform,
} from "motion/react";
import {
  User,
  Plus,
  Utensils,
  Coffee,
  Wine,
  Link2,
  Share2,
  Check,
  ArrowRight,
} from "lucide-react";

export interface ShowcaseStep {
  title: string;
  description: string;
}

const ease = [0.22, 1, 0.36, 1] as const;

/* ── Per-step mock previews (schematic, monochrome) ──────────────────────── */

function SignupMock({ brand }: { brand: string }) {
  return (
    <div className="w-64 rounded-2xl border border-border bg-background p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
          <User className="h-4 w-4" />
        </div>
        <div className="text-sm font-semibold tracking-tight">{brand}</div>
      </div>
      <div className="mt-5 space-y-3">
        <div className="rounded-lg border border-border px-3 py-2.5">
          <div className="h-2 w-24 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="rounded-lg border border-border px-3 py-2.5">
          <div className="h-2 w-16 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-foreground py-2.5 text-xs font-semibold text-background">
        <span className="h-1.5 w-16 rounded-full bg-background/60" />
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

function ProductsMock() {
  const items = [Utensils, Coffee, Wine];
  const prices = ["$4.90", "$3.50", "$8.00"];
  return (
    <div className="w-72 rounded-2xl border border-border bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Menu
        </span>
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
          <Plus className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {items.map((Icon, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border p-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-4 w-4 text-foreground" strokeWidth={1.75} />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-2/3 rounded-full bg-muted-foreground/30" />
              <div className="h-1.5 w-full rounded-full bg-muted" />
            </div>
            <span className="text-xs font-semibold">{prices[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomizeMock() {
  const swatches = [
    "bg-foreground",
    "bg-muted-foreground",
    "bg-muted-foreground/60",
    "bg-muted-foreground/30",
    "bg-muted",
  ];
  return (
    <div className="w-64 space-y-6 rounded-2xl border border-border bg-background p-5 shadow-sm">
      <div>
        <div className="mb-3 h-2 w-16 rounded-full bg-muted-foreground/40" />
        <div className="flex gap-2.5">
          {swatches.map((s, i) => (
            <div
              key={i}
              className={`h-8 w-8 rounded-full ${s} ${
                i === 0 ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
              }`}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-3 h-2 w-20 rounded-full bg-muted-foreground/40" />
        <div className="inline-flex rounded-lg border border-border p-1">
          <span className="rounded-md bg-foreground px-4 py-1.5 text-xs font-semibold text-background">
            EN
          </span>
          <span className="px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            TR
          </span>
          <span className="px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            DE
          </span>
        </div>
      </div>
    </div>
  );
}

function QrCells() {
  // deterministic QR-like pattern with three finder squares
  const size = 13;
  const cells = [];
  const finder = (r: number, c: number) =>
    (r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const on = finder(r, c) || (r * 7 + c * 3) % 5 < 2;
      cells.push(on);
    }
  }
  return (
    <div
      className="grid gap-0.5"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
    >
      {cells.map((on, i) => (
        <div
          key={i}
          className={`aspect-square rounded-[1px] ${on ? "bg-foreground" : "bg-transparent"}`}
        />
      ))}
    </div>
  );
}

function ShareMock({ brand }: { brand: string }) {
  return (
    <div className="w-60 rounded-2xl border border-border bg-background p-5 text-center shadow-sm">
      <div className="mx-auto w-40 rounded-xl border border-border bg-card p-3">
        <QrCells />
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2">
        <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">
          garage.menu/{brand.toLowerCase().replace(/\s+/g, "")}
        </span>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border">
          <Share2 className="h-3.5 w-3.5" />
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border">
          <Check className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

function StepMock({ index, brand }: { index: number; brand: string }) {
  switch (index) {
    case 0:
      return <SignupMock brand={brand} />;
    case 1:
      return <ProductsMock />;
    case 2:
      return <CustomizeMock />;
    default:
      return <ShareMock brand={brand} />;
  }
}

/**
 * Apple-style pinned scroll section: the visual on the right stays fixed while
 * the steps on the left scroll; the active step drives which mock is shown and
 * a progress rail fills. Powered by motion's useScroll (reliable, no pinning).
 */
export function ScrollShowcase({
  eyebrow,
  heading,
  brand,
  steps,
}: {
  eyebrow: string;
  heading: string;
  brand: string;
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
    const idx = Math.max(
      0,
      Math.min(steps.length - 1, Math.floor(v * steps.length))
    );
    setActive(idx);
  });

  return (
    <section
      ref={ref}
      className="relative"
      style={{ height: `${steps.length * 90}vh` }}
    >
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
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground/60"
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

          {/* Right: sticky visual that swaps the mock per active step */}
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-border bg-muted/40 shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(color-mix(in_oklch,var(--border)_80%,transparent)_1px,transparent_1px)] bg-size-[28px_28px] opacity-[0.35]" />
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -12 }}
                transition={{ duration: 0.4, ease }}
                className="relative"
              >
                <StepMock index={active} brand={brand} />
              </motion.div>
            </AnimatePresence>

            <span className="absolute bottom-4 right-5 text-xs font-medium tabular-nums text-muted-foreground">
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(steps.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
