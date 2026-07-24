"use client";

import { motion } from "motion/react";
import { QrCode, Star, Globe, Utensils } from "lucide-react";
import { LottieHero } from "./LottieHero";

interface HeroVisualProps {
  brand: string;
  langChip: string;
  ratingChip: string;
}

const rows = [
  { icon: Utensils, price: "$4.90" },
  { icon: QrCode, price: "$8.90" },
  { icon: Globe, price: "$12.90" },
];

/** Animated, monochrome glass menu preview with floating chips + Lottie accent. */
export function HeroVisual({ brand, langChip, ratingChip }: HeroVisualProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="relative mx-auto w-full max-w-sm"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-3xl border border-border bg-card p-4 shadow-xl shadow-foreground/5"
      >
        <div className="rounded-2xl bg-muted/50 p-5">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold tracking-tight text-foreground">
              {brand}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background shadow-sm">
              <QrCode className="h-5 w-5 text-foreground" />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {rows.map((row, i) => {
              const Icon = row.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.12, duration: 0.5 }}
                  className="flex items-center gap-3 rounded-xl bg-background p-3 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="h-2.5 w-2/3 rounded-full bg-muted-foreground/30" />
                    <div className="mt-1.5 h-2 w-full rounded-full bg-muted" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {row.price}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* floating rating chip */}
      <motion.div
        animate={{ y: [0, 9, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-5 top-16 flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2 shadow-lg"
      >
        <Star className="h-4 w-4 fill-foreground text-foreground" />
        <span className="text-sm font-semibold text-foreground">{ratingChip}</span>
      </motion.div>

      {/* floating language chip */}
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        className="absolute -right-4 bottom-24 flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2 shadow-lg"
      >
        <Globe className="h-4 w-4 text-foreground" />
        <span className="text-sm font-semibold text-foreground">{langChip}</span>
      </motion.div>

      {/* Lottie accent, desaturated to fit the monochrome theme */}
      <LottieHero className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 opacity-70 grayscale" />
    </motion.div>
  );
}
