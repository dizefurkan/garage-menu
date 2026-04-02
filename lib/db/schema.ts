/**
 * Database Type Definitions
 * Auto-generated types for Supabase tables (or manually maintained)
 * @path lib/db/schema.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// AUTH & TENANTS
// ============================================================================

export type Tenant = {
  id: bigint;
  created_at: string;
  updated_at: string;
  slug: string;
  name: string;
  email?: string;
  phone?: string;
  theme_config: {
    primary: string;
    secondary: string;
    font?: string;
    [key: string]: string;
  };
  languages: string[];
  default_language: string;
  logo_url?: string;
  description?: string;
  is_active: boolean;
};

export type TenantUser = {
  id: bigint;
  created_at: string;
  tenant_id: bigint;
  user_id: string; // UUID from auth.users
  role: "owner" | "editor" | "viewer";
  invited_at?: string;
  accepted_at?: string;
};

export type Invitation = {
  id: bigint;
  created_at: string;
  email: string;
  token: string;
  tenant_id: bigint;
  invited_by: string; // UUID
  accepted_at?: string;
  expires_at: string;
};

// ============================================================================
// CATEGORIES
// ============================================================================

export type Category = {
  id: bigint;
  created_at: string;
  updated_at: string;
  tenant_id: bigint;
  display_order: number;
  is_draft: boolean;
  published_at?: string;
  created_by: string; // UUID
  updated_by: string; // UUID
};

export type CategoryTranslation = {
  id: bigint;
  created_at: string;
  updated_at: string;
  category_id: bigint;
  language_code: string;
  name: string;
  description?: string;
  slug?: string;
};

/* Category with translations joined */
export type CategoryWithTranslations = Category & {
  category_translations: CategoryTranslation[];
};

// ============================================================================
// PRODUCTS
// ============================================================================

export type Product = {
  id: bigint;
  created_at: string;
  updated_at: string;
  tenant_id: bigint;
  category_id: bigint | null;
  price: number;
  currency: string;
  image_url?: string;
  is_draft: boolean;
  published_at?: string;
  display_order: number;
  is_available: boolean;
  created_by: string; // UUID
  updated_by: string; // UUID
};

export type ProductTranslation = {
  id: bigint;
  created_at: string;
  updated_at: string;
  product_id: bigint;
  language_code: string;
  name: string;
  description?: string;
  slug?: string;
};

/* Product with translations joined */
export type ProductWithTranslations = Product & {
  product_translations: ProductTranslation[];
};

// ============================================================================
// VIEWS (if using Supabase views)
// ============================================================================

export type ProductsWithTranslationsView = {
  id: bigint;
  tenant_id: bigint;
  category_id: bigint | null;
  price: number;
  currency: string;
  image_url?: string;
  is_draft: boolean;
  published_at?: string;
  display_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  translations: {
    [language_code: string]: {
      name: string;
      description?: string;
      slug?: string;
    };
  };
};

export type CategoriesWithTranslationsView = {
  id: bigint;
  tenant_id: bigint;
  display_order: number;
  is_draft: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  translations: {
    [language_code: string]: {
      name: string;
      description?: string;
      slug?: string;
    };
  };
};

// ============================================================================
// FORM SCHEMAS (for validation with zod)
// ============================================================================

import { z } from "zod";

export const CreateProductSchema = z.object({
  category_id: z.number().int().positive("Category is required"),
  price: z.number().positive("Price must be positive"),
  is_draft: z.boolean().default(true),
  image_url: z.string().url().optional().or(z.literal("")),
  translations: z.record(
    z.enum(["tr", "en"]),
    z.object({
      name: z.string().min(1, "Name required").max(255),
      description: z.string().max(1000).optional(),
    })
  ),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.number().int().positive(),
});

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

export const CreateCategorySchema = z.object({
  display_order: z.number().int().default(0),
  is_draft: z.boolean().default(true),
  translations: z.record(
    z.enum(["tr", "en"]),
    z.object({
      name: z.string().min(1, "Name required").max(255),
      description: z.string().max(1000).optional(),
    })
  ),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const InviteUserSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["owner", "editor", "viewer"]),
});

export type InviteUserInput = z.infer<typeof InviteUserSchema>;
