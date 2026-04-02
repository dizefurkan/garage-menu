/**
 * Validation Schemas & Constants
 * Zod schemas for form validation and type-safe data handling
 * @path lib/utils/validation.ts
 */

import { z } from "zod";

// ============================================================================
// PASSWORD & AUTH SCHEMAS
// ============================================================================

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const EmailSchema = z.string().email("Invalid email address");

export const AuthSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export const ProductNameSchema = z
  .string()
  .min(1, "Product name is required")
  .max(255, "Product name must be less than 255 characters");

export const ProductDescriptionSchema = z
  .string()
  .max(2000, "Description must be less than 2000 characters")
  .optional();

export const TranslationSchema = z.object({
  name: ProductNameSchema,
  description: ProductDescriptionSchema,
});

export const PriceSchema = z
  .number()
  .positive("Price must be positive")
  .finite("Price must be a valid number");

export const CreateProductSchema = z.object({
  category_id: z.number().int().positive("Category is required"),
  price: PriceSchema,
  is_draft: z.boolean().default(true),
  image_url: z.string().url().optional().or(z.literal("")),
  translations: z.record(z.enum(["tr", "en"]), TranslationSchema),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.number().int().positive(),
});

// ============================================================================
// CATEGORY SCHEMAS
// ============================================================================

export const CreateCategorySchema = z.object({
  display_order: z.number().int().default(0),
  is_draft: z.boolean().default(true),
  translations: z.record(z.enum(["tr", "en"]), TranslationSchema),
});

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  id: z.number().int().positive(),
});

// ============================================================================
// INVITE SCHEMAS
// ============================================================================

export const RoleSchema = z.enum(["owner", "editor", "viewer"]);

export const InviteUserSchema = z.object({
  email: EmailSchema,
  role: RoleSchema,
});

// ============================================================================
// THEME SCHEMAS
// ============================================================================

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color");

export const FontSchema = z.enum(["serif", "sans", "mono"]);

export const ThemeConfigSchema = z.object({
  primary: HexColorSchema,
  secondary: HexColorSchema,
  accent: HexColorSchema.optional(),
  font: FontSchema.optional(),
});

// ============================================================================
// TENANT SETTINGS SCHEMAS
// ============================================================================

export const TenantSettingsSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  description: z.string().max(500).optional(),
  logo_url: z.string().url().optional(),
  theme_config: ThemeConfigSchema.optional(),
  languages: z.array(z.string()).default(["en", "tr"]),
  default_language: z.string().default("en"),
});

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type InviteUserInput = z.infer<typeof InviteUserSchema>;
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;
export type TenantSettings = z.infer<typeof TenantSettingsSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

export const VALID_LANGUAGES = ["en", "tr", "de", "fr", "es", "it"] as const;
export const DEFAULT_LANGUAGES = ["en", "tr"] as const;
export const ADMIN_ROLES = ["owner", "editor", "viewer"] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

export const THEME_COLORS = {
  primary: {
    DEFAULT: "#000000",
    light: "#333333",
    dark: "#000000",
  },
  secondary: {
    DEFAULT: "#FFFFFF",
    light: "#FFFFFF",
    dark: "#F3F4F6",
  },
} as const;
