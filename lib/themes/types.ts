/**
 * Theme System
 * Type definitions and utilities for themeable UI
 * @path lib/themes/types.ts
 */

export type ThemeConfig = {
  primary: string; // Main color (hex)
  secondary: string; // Secondary color (hex)
  accent?: string; // Optional accent color
  font?: "serif" | "sans" | "mono";
  [key: string]: string | undefined;
};

export type ThemePreset = {
  id: string;
  name: string;
  config: ThemeConfig;
};

/**
 * Pre-built theme presets
 * Users can select these or customize
 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    name: "Garage (Default)",
    config: {
      primary: "#8B0333", // Deep burgundy
      secondary: "#F2F0E9", // Cream
      font: "serif",
    },
  },
  {
    id: "minimal-dark",
    name: "Minimal Dark",
    config: {
      primary: "#000000",
      secondary: "#FFFFFF",
      accent: "#F0F0F0",
      font: "sans",
    },
  },
  {
    id: "warm-gradient",
    name: "Warm Gradient",
    config: {
      primary: "#E85D04", // Orange
      secondary: "#FB8500", // Gold
      accent: "#FFB703",
      font: "sans",
    },
  },
  {
    id: "forest",
    name: "Forest",
    config: {
      primary: "#1B4332", // Dark green
      secondary: "#D6CC99", // Light tan
      accent: "#40916C",
      font: "serif",
    },
  },
];

/**
 * Convert theme config to CSS variables
 * Usage: Apply to document root in layout
 */
export function themeConfigToCss(config: ThemeConfig): string {
  return `
    --color-primary: ${config.primary};
    --color-secondary: ${config.secondary};
    ${config.accent ? `--color-accent: ${config.accent};` : ""}
    ${config.font ? `--font-family: ${getFontFamily(config.font)};` : ""}
  `;
}

function getFontFamily(font: string): string {
  switch (font) {
    case "serif":
      return "Georgia, serif";
    case "mono":
      return "Courier New, monospace";
    case "sans":
    default:
      return "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  }
}

/**
 * Get theme from tenant config
 */
export function getTenantTheme(themeConfig: ThemeConfig | null): ThemeConfig {
  // Fallback to default theme if not set
  const preset = THEME_PRESETS.find((p) => p.id === "default");
  return themeConfig ?? preset!.config;
}

/**
 * Validate theme config (basic)
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

export function validateThemeConfig(config: ThemeConfig): boolean {
  return (
    isValidHexColor(config.primary) &&
    isValidHexColor(config.secondary) &&
    (!config.accent || isValidHexColor(config.accent))
  );
}
