"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Animate direct children with a stagger instead of the wrapper itself */
  stagger?: boolean;
  y?: number;
  delay?: number;
}

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Reliable scroll reveal using motion's `whileInView` (IntersectionObserver).
 * Replaces the previous GSAP ScrollTrigger version which could leave sections
 * stuck at opacity:0 when trigger positions were miscalculated after layout shift.
 */
export function Reveal({
  children,
  className,
  stagger = false,
  y = 24,
  delay = 0,
}: RevealProps) {
  if (stagger) {
    return (
      <motion.div
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08, delayChildren: delay } },
        }}
      >
        {Array.isArray(children)
          ? children.map((child, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
                }}
              >
                {child}
              </motion.div>
            ))
          : children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease, delay }}
    >
      {children}
    </motion.div>
  );
}
