"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface SquishProps {
  children: ReactNode;
  className?: string;
}

/**
 * Subtle, precise press feedback (Vercel/Apple-style) — gentle scale on
 * hover/tap, no bounce. Wrap a Link or button.
 */
export function Squish({ children, className }: SquishProps) {
  return (
    <motion.div
      className={className}
      style={{ display: "inline-flex" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}
