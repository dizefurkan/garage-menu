// @ts-nocheck
/**
 * Database Server Actions & Queries
 * Type-safe server-side database operations with RLS
 * @path lib/db/queries.ts
 */

"use server";

import { supabase, supabaseAdmin } from "@/lib/auth/supabase";
import {
  getCurrentTenantId,
  getCurrentUser,
  verifyCanEdit,
  verifyTenantAccess,
} from "@/lib/auth/server";
import type {
  Product,
  ProductWithTranslations,
  Category,
  CategoryWithTranslations,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  InviteUserInput,
} from "@/lib/db/schema";
import { nanoid } from "nanoid";

// ============================================================================
// PRODUCTS
// ============================================================================

/**
 * Get all published products for a tenant with translations
 */
export async function getPublishedProducts(
  tenantId: bigint,
  language?: string
): Promise<ProductWithTranslations[]> {
  let query = supabase
    .from("products")
    .select(
      `
      id, tenant_id, category_id, price, currency, image_url, 
      display_order, is_available, created_at, updated_at,
      product_translations(language_code, name, description, slug)
    `
    )
    .eq("tenant_id", tenantId)
    .eq("is_draft", false)
    .order("display_order");

  if (language) {
    query = query.eq("product_translations.language_code", language);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data as ProductWithTranslations[];
}

/**
 * Get single product with translations
 */
export async function getProduct(
  productId: bigint
): Promise<ProductWithTranslations | null> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, tenant_id, category_id, price, currency, image_url, is_draft,
      published_at, display_order, is_available, created_at, updated_at,
      product_translations(id, language_code, name, description, slug)
    `
    )
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }

  return data as ProductWithTranslations;
}

/**
 * Create a new product with translations
 */
export async function createProduct(input: CreateProductInput) {
  const tenantId = await getCurrentTenantId();
  const user = await getCurrentUser();

  if (!tenantId || !user || !(await verifyCanEdit(tenantId))) {
    throw new Error("Unauthorized");
  }

  // 1. Insert product
  const { data: product, error: productError } = await (supabase as any)
    .from("products")
    .insert({
      tenant_id: tenantId,
      category_id: input.category_id,
      price: input.price,
      is_draft: input.is_draft ?? true,
      image_url: input.image_url || null,
      display_order: 0,
      is_available: true,
      currency: "TRY",
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (productError || !product) {
    console.error("Error creating product:", productError);
    throw new Error("Failed to create product");
  }

  // 2. Insert translations
  const translations = Object.entries(input.translations).map(
    ([language, content]) => ({
      product_id: product.id,
      language_code: language,
      name: content.name,
      description: content.description || null,
      slug: content.name.toLowerCase().replace(/\s+/g, "-"),
    })
  );

  const { error: transError } = await ((supabase as any)
    .from("product_translations")
    .insert(translations) as any);

  if (transError) {
    console.error("Error creating translations:", transError);
    throw new Error("Failed to create translations");
  }

  return product;
}

/**
 * Update a product with translations
 */
export async function updateProduct(input: UpdateProductInput) {
  const tenantId = await getCurrentTenantId();
  const user = await getCurrentUser();

  if (!tenantId || !user || !(await verifyCanEdit(tenantId))) {
    throw new Error("Unauthorized");
  }

  // 1. Update product fields
  if (input.id) {
    const updateData: Record<string, unknown> = {
      updated_by: user.id,
    };
    if (input.category_id) updateData.category_id = input.category_id;
    if (input.price) updateData.price = input.price;
    if (input.image_url !== undefined)
      updateData.image_url = input.image_url || null;
    if (input.is_draft !== undefined) updateData.is_draft = input.is_draft;

    const { error: updateError } = await ((supabase as any)
      .from("products")
      .update(updateData)
      .eq("id", input.id)
      .eq("tenant_id", tenantId) as any);

    if (updateError) {
      console.error("Error updating product:", updateError);
      throw new Error("Failed to update product");
    }
  }

  // 2. Update translations (upsert pattern)
  if (input.translations) {
    for (const [language, content] of Object.entries(input.translations)) {
      await (supabase as any).from("product_translations").upsert(
        {
          product_id: input.id,
          language_code: language,
          name: content.name,
          description: content.description || null,
          slug: content.name.toLowerCase().replace(/\s+/g, "-"),
        },
        { onConflict: "product_id,language_code" }
      );
    }
  }
}

/**
 * Delete a product (and cascade delete translations)
 */
export async function deleteProduct(productId: bigint) {
  const tenantId = await getCurrentTenantId();
  const user = await getCurrentUser();

  if (!tenantId || !user || !(await verifyCanEdit(tenantId))) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("Error deleting product:", error);
    throw new Error("Failed to delete product");
  }
}

/**
 * Publish a product (draft → live)
 */
export async function publishProduct(productId: bigint) {
  const tenantId = await getCurrentTenantId();

  if (!tenantId || !(await verifyCanEdit(tenantId))) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("products")
    .update({ is_draft: false, published_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("tenant_id", tenantId);

  if (error) {
    throw new Error("Failed to publish product");
  }
}

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * Get all published categories with translations
 */
export async function getPublishedCategories(
  tenantId: bigint
): Promise<CategoryWithTranslations[]> {
  const { data, error } = await supabase
    .from("categories")
    .select(
      `
      id, tenant_id, display_order, created_at, updated_at,
      category_translations(language_code, name, description, slug)
    `
    )
    .eq("tenant_id", tenantId)
    .eq("is_draft", false)
    .order("display_order");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data as CategoryWithTranslations[];
}

/**
 * Get category by ID with translations
 */
export async function getCategory(
  categoryId: bigint
): Promise<CategoryWithTranslations | null> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;

  const { data, error } = await supabase
    .from("categories")
    .select(
      `
      id, tenant_id, display_order, is_draft, created_at, updated_at,
      category_translations(language_code, name, description)
    `
    )
    .eq("id", categoryId)
    .eq("tenant_id", tenantId)
    .single();

  if (error) {
    console.error("Error fetching category:", error);
    return null;
  }

  return data as CategoryWithTranslations;
}

/**
 * Create a new category
 */
export async function createCategory(input: CreateCategoryInput) {
  const tenantId = await getCurrentTenantId();
  const user = await getCurrentUser();

  if (!tenantId || !user || !(await verifyCanEdit(tenantId))) {
    throw new Error("Unauthorized");
  }

  // 1. Insert category
  const { data: category, error: catError } = await supabase
    .from("categories")
    .insert({
      tenant_id: tenantId,
      display_order: input.display_order ?? 0,
      is_draft: input.is_draft ?? true,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (catError || !category) {
    throw new Error("Failed to create category");
  }

  // 2. Insert translations
  const translations = Object.entries(input.translations).map(
    ([language, content]) => ({
      category_id: category.id,
      language_code: language,
      name: content.name,
      description: content.description || null,
    })
  );

  const { error: transError } = await supabase
    .from("category_translations")
    .insert(translations);

  if (transError) {
    throw new Error("Failed to create translations");
  }

  return category;
}

/**
 * Update a category
 */
export async function updateCategory(
  categoryId: bigint,
  input: CreateCategoryInput
) {
  const tenantId = await getCurrentTenantId();
  const user = await getCurrentUser();

  if (!tenantId || !user || !(await verifyCanEdit(tenantId))) {
    throw new Error("Unauthorized");
  }

  // Update category
  await supabase
    .from("categories")
    .update({
      display_order: input.display_order,
      updated_by: user.id,
    })
    .eq("id", categoryId)
    .eq("tenant_id", tenantId);

  // Update translations
  for (const [language, content] of Object.entries(input.translations)) {
    await (supabase as any).from("category_translations").upsert(
      {
        category_id: categoryId,
        language_code: language,
        name: content.name,
        description: content.description || null,
      },
      { onConflict: "category_id,language_code" }
    );
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: bigint) {
  const tenantId = await getCurrentTenantId();

  if (!tenantId || !(await verifyCanEdit(tenantId))) {
    throw new Error("Unauthorized");
  }

  await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("tenant_id", tenantId);
}

// ============================================================================
// INVITATIONS
// ============================================================================

/**
 * Send invite to a user
 */
export async function sendInvite(input: InviteUserInput, tenantId: bigint) {
  const user = await getCurrentUser();

  // Only owners can invite
  const { data: tenantUser } = await supabase
    .from("tenant_users")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user?.id)
    .single();

  if (tenantUser?.role !== "owner") {
    throw new Error("Only owners can send invites");
  }

  const token = nanoid(32);

  const { error } = await (supabase as any).from("invitations").insert({
    email: input.email,
    token,
    tenant_id: tenantId,
    invited_by: user!.id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (error) {
    throw new Error("Failed to create invitation");
  }

  return { token, email: input.email };
}

/**
 * Accept an invitation (called from invite link)
 */
export async function acceptInvite(token: string) {
  // 1. Find the invitation
  const { data: invitation, error: inviteError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (inviteError || !invitation) {
    throw new Error("Invalid or expired invitation");
  }

  // Check expiration
  if (new Date(invitation.expires_at) < new Date()) {
    throw new Error("Invitation has expired");
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be logged in to accept an invitation");
  }

  // 2. Add user to tenant
  const { error: addError } = await (supabase as any)
    .from("tenant_users")
    .insert({
      tenant_id: invitation.tenant_id,
      user_id: user.id,
      role: "editor",
      accepted_at: new Date().toISOString(),
    });

  if (addError) {
    throw new Error("Failed to accept invitation");
  }

  // 3. Mark invitation as accepted
  await supabase
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);
}
