-- ============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each tenant can only access their own data
-- ============================================================================

-- ============================================================================
-- 0. DROP EXISTING POLICIES (Clean slate)
-- ============================================================================
DROP POLICY IF EXISTS "Users can select own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Ops: Allow service role full access" ON public.tenants;
DROP POLICY IF EXISTS "Users can select own tenant members" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant owners can insert new members" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant owners can update members" ON public.tenant_users;
DROP POLICY IF EXISTS "Ops: Allow service role full access" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant owners can select invitations" ON public.invitations;
DROP POLICY IF EXISTS "Tenant owners can insert invitations" ON public.invitations;
DROP POLICY IF EXISTS "Ops: Allow service role full access" ON public.invitations;
DROP POLICY IF EXISTS "Users can select published categories" ON public.categories;
DROP POLICY IF EXISTS "Editors can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Editors can update categories" ON public.categories;
DROP POLICY IF EXISTS "Editors can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Ops: Allow service role full access" ON public.categories;
DROP POLICY IF EXISTS "Users can select translations of published categories" ON public.category_translations;
DROP POLICY IF EXISTS "Editors can insert translations" ON public.category_translations;
DROP POLICY IF EXISTS "Editors can update translations" ON public.category_translations;
DROP POLICY IF EXISTS "Editors can delete translations" ON public.category_translations;
DROP POLICY IF EXISTS "Ops: Allow service role full access" ON public.category_translations;
DROP POLICY IF EXISTS "Users can select published products" ON public.products;
DROP POLICY IF EXISTS "Editors can insert products" ON public.products;
DROP POLICY IF EXISTS "Editors can update products" ON public.products;
DROP POLICY IF EXISTS "Editors can delete products" ON public.products;
DROP POLICY IF EXISTS "Ops: Allow service role full access" ON public.products;
DROP POLICY IF EXISTS "Users can select translations of published products" ON public.product_translations;
DROP POLICY IF EXISTS "Editors can insert translations" ON public.product_translations;
DROP POLICY IF EXISTS "Editors can update translations" ON public.product_translations;
DROP POLICY IF EXISTS "Editors can delete translations" ON public.product_translations;
DROP POLICY IF EXISTS "Ops: Allow service role full access" ON public.product_translations;
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- IMPORTANT: After creating tables, enable RLS on all tables:

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id
-- NOTE: Must be in public schema, not auth schema (auth is Supabase-managed)
CREATE OR REPLACE FUNCTION public.user_tenant_id()
RETURNS BIGINT AS $$
  SELECT tenant_id FROM public.tenant_users
  WHERE user_id = auth.uid()
  LIMIT 1
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- TENANTS TABLE - RLS POLICIES
-- Users can only read their own tenant
-- ============================================================================

CREATE POLICY "Users can select own tenant"
  ON public.tenants FOR SELECT
  USING (
    id = public.user_tenant_id()
  );

CREATE POLICY "Ops: Allow service role full access"
  ON public.tenants
  USING (auth.role() = 'service_role');

-- ============================================================================
-- TENANT_USERS TABLE - RLS POLICIES
-- Users can view team members of their tenant
-- ============================================================================

CREATE POLICY "Users can select own tenant members"
  ON public.tenant_users FOR SELECT
  USING (
    tenant_id = public.user_tenant_id()
  );

CREATE POLICY "Tenant owners can insert new members"
  ON public.tenant_users FOR INSERT
  WITH CHECK (
    tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

CREATE POLICY "Tenant owners can update members"
  ON public.tenant_users FOR UPDATE
  USING (tenant_id = public.user_tenant_id())
  WITH CHECK (
    tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

CREATE POLICY "Ops: Allow service role full access"
  ON public.tenant_users
  USING (auth.role() = 'service_role');

-- ============================================================================
-- INVITATIONS TABLE - RLS POLICIES
-- Only tenant owners can create/manage invitations
-- Anyone with valid token can accept their own invitation
-- ============================================================================

CREATE POLICY "Tenant owners can select invitations"
  ON public.invitations FOR SELECT
  USING (
    tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

CREATE POLICY "Tenant owners can insert invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    tenant_id = public.user_tenant_id()
    AND invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

CREATE POLICY "Ops: Allow service role full access"
  ON public.invitations
  USING (auth.role() = 'service_role');

-- ============================================================================
-- CATEGORIES TABLE - RLS POLICIES
-- Users can read published categories from their tenant
-- Editors/Owners can CRUD drafts of their tenant
-- ============================================================================

CREATE POLICY "Users can select published categories"
  ON public.categories FOR SELECT
  USING (
    tenant_id = public.user_tenant_id()
    AND (is_draft = FALSE OR EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    ))
  );

CREATE POLICY "Editors can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    tenant_id = public.user_tenant_id()
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Editors can update categories"
  ON public.categories FOR UPDATE
  USING (
    tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    tenant_id = public.user_tenant_id()
    AND updated_by = auth.uid()
  );

CREATE POLICY "Editors can delete categories"
  ON public.categories FOR DELETE
  USING (
    tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Ops: Allow service role full access"
  ON public.categories
  USING (auth.role() = 'service_role');

-- ============================================================================
-- CATEGORY_TRANSLATIONS TABLE - RLS POLICIES
-- Inherit from categories table permissions
-- ============================================================================

CREATE POLICY "Users can select translations of published categories"
  ON public.category_translations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id
        AND c.tenant_id = public.user_tenant_id()
        AND (c.is_draft = FALSE OR EXISTS (
          SELECT 1 FROM public.tenant_users
          WHERE tenant_id = public.user_tenant_id()
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        ))
    )
  );

CREATE POLICY "Editors can insert translations"
  ON public.category_translations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id
        AND c.tenant_id = public.user_tenant_id()
        AND EXISTS (
          SELECT 1 FROM public.tenant_users
          WHERE tenant_id = public.user_tenant_id()
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
    )
  );

CREATE POLICY "Editors can update translations"
  ON public.category_translations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id
        AND c.tenant_id = public.user_tenant_id()
        AND EXISTS (
          SELECT 1 FROM public.tenant_users
          WHERE tenant_id = public.user_tenant_id()
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
    )
  );

CREATE POLICY "Editors can delete translations"
  ON public.category_translations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id
        AND c.tenant_id = public.user_tenant_id()
        AND EXISTS (
          SELECT 1 FROM public.tenant_users
          WHERE tenant_id = public.user_tenant_id()
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
    )
  );

CREATE POLICY "Ops: Allow service role full access"
  ON public.category_translations
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PRODUCTS TABLE - RLS POLICIES
-- Same pattern as categories
-- ============================================================================

CREATE POLICY "Users can select published products"
  ON public.products FOR SELECT
  USING (
    tenant_id = public.user_tenant_id()
    AND (is_draft = FALSE OR EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    ))
  );

CREATE POLICY "Editors can insert products"
  ON public.products FOR INSERT
  WITH CHECK (
    tenant_id = public.user_tenant_id()
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Editors can update products"
  ON public.products FOR UPDATE
  USING (
    tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    tenant_id = public.user_tenant_id()
    AND updated_by = auth.uid()
  );

CREATE POLICY "Editors can delete products"
  ON public.products FOR DELETE
  USING (
    tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Ops: Allow service role full access"
  ON public.products
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PRODUCT_TRANSLATIONS TABLE - RLS POLICIES
-- Same pattern as category_translations
-- ============================================================================

CREATE POLICY "Users can select translations of published products"
  ON public.product_translations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.tenant_id = public.user_tenant_id()
        AND (p.is_draft = FALSE OR EXISTS (
          SELECT 1 FROM public.tenant_users
          WHERE tenant_id = public.user_tenant_id()
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        ))
    )
  );

CREATE POLICY "Editors can insert translations"
  ON public.product_translations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.tenant_id = public.user_tenant_id()
        AND EXISTS (
          SELECT 1 FROM public.tenant_users
          WHERE tenant_id = public.user_tenant_id()
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
    )
  );

CREATE POLICY "Editors can update translations"
  ON public.product_translations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.tenant_id = public.user_tenant_id()
        AND EXISTS (
          SELECT 1 FROM public.tenant_users
          WHERE tenant_id = public.user_tenant_id()
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
    )
  );

CREATE POLICY "Editors can delete translations"
  ON public.product_translations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.tenant_id = public.user_tenant_id()
        AND EXISTS (
          SELECT 1 FROM public.tenant_users
          WHERE tenant_id = public.user_tenant_id()
            AND user_id = auth.uid()
            AND role IN ('owner', 'editor')
        )
    )
  );

CREATE POLICY "Ops: Allow service role full access"
  ON public.product_translations
  USING (auth.role() = 'service_role');

-- ============================================================================
-- STORAGE POLICIES (for images)
-- Enable storage bucket RLS before applying these
-- ============================================================================

-- Create `product-images` bucket in Supabase console first!

-- Allow authenticated users to upload to their tenant's folder
CREATE POLICY "Users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (public.user_tenant_id())::TEXT
  );

-- Allow public read access (images are public)
CREATE POLICY "Public read access to product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (public.user_tenant_id())::TEXT
  );
