"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LottieAnimation, type LottieLoader } from "@/components/ui/lottie-animation";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Static visual. Always rendered when no animation is playing. */
  icon: LucideIcon;
  /** Optional Lottie that replaces the icon when motion is allowed. */
  animation?: LottieLoader;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  /**
   * `invite` — nothing here yet, and the user can fix that. Offers a CTA.
   * `inform` — nothing here for *you*. Quieter, no CTA; used for 403.
   */
  tone?: "invite" | "inform";
  className?: string;
}

/**
 * Shared empty / denied state.
 *
 * Deliberately monochrome: it inherits theme tokens rather than picking its
 * own colours, so it works in both themes and does not fight the surrounding
 * page. Copy is passed in by the caller so every usage stays context-specific
 * — an empty product table and an empty order list should not read the same.
 */
export function EmptyState({
  icon: Icon,
  animation,
  title,
  description,
  action,
  tone = "invite",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed border-border bg-muted/30 px-8 py-16 text-center",
        className
      )}
    >
      <div className="relative mb-6 flex size-24 items-center justify-center">
        {animation && (
          <LottieAnimation load={animation} className="absolute inset-0" />
        )}
        <div
          className={cn(
            "flex size-16 items-center justify-center rounded-2xl border border-border bg-background",
            tone === "inform" && "opacity-70"
          )}
        >
          <Icon className="size-7 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {/* `inform` states intentionally offer no action — there is nothing the
          viewer can do about a permission boundary, and a button would imply
          otherwise. */}
      {action && tone === "invite" && (
        <Button asChild className="mt-6">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
