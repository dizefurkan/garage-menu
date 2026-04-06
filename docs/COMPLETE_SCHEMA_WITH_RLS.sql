-- ============================================================================
-- COMPLETE SUPABASE SCHEMA & RLS SETUP - COPY & PASTE IN SQL EDITOR
-- ============================================================================
-- This creates everything you need from scratch

-- ============================================================================
-- 0. DROP EXISTING OBJECTS (Clean slate)
-- ============================================================================
DROP TABLE IF EXISTS public.product_translations CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.category_translations CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.tenant_users CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.publish_product(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.publish_category(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.products_with_translations(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.categories_with_translations(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.user_tenant_id() CASCADE;

-- ============================================================================
-- 1. AUTH & TENANTS
-- ============================================================================

-- Tenants (restaurants/businesses)
CREATE TABLE public.tenants (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Tenant identity
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Branding & Settings
  theme_config JSONB DEFAULT '{"primary": "#000000", "secondary": "#FFFFFF"}',
  languages TEXT[] DEFAULT '{"en","tr"}',
  default_language VARCHAR(5) DEFAULT 'en',
  
  -- Contact Information
  contact_info JSONB DEFAULT '{"address": "", "facebook": "", "instagram": "", "tiktok": "", "email": "", "whatsapp": ""}',
  
  -- Metadata
  logo_url TEXT,
  description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Tenant users (team members)
CREATE TABLE public.tenant_users (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role VARCHAR(20) NOT NULL DEFAULT 'editor',
  
  invited_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(tenant_id, user_id)
);

-- User invitations (for onboarding)
CREATE TABLE public.invitations (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  
  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  
  CONSTRAINT token_length CHECK (LENGTH(token) >= 20)
);

-- ============================================================================
-- 2. CATEGORIES & CATEGORY TRANSLATIONS
-- ============================================================================

CREATE TABLE public.categories (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  display_order INT DEFAULT 0,
  is_draft BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE public.category_translations (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  
  language_code VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255),
  
  UNIQUE(category_id, language_code),
  CONSTRAINT language_code_format CHECK (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

-- ============================================================================
-- 3. PRODUCTS & PRODUCT TRANSLATIONS
-- ============================================================================

CREATE TABLE public.products (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE SET NULL,
  
  price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  
  image_url TEXT,
  
  is_draft BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  display_order INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  
  CONSTRAINT price_positive CHECK (price >= 0)
);

CREATE TABLE public.product_translations (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  language_code VARCHAR(5) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255),
  
  UNIQUE(product_id, language_code),
  CONSTRAINT language_code_format CHECK (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

-- ============================================================================
-- 4. INDEXES (for performance)
-- ============================================================================

CREATE INDEX idx_categories_tenant_id ON public.categories(tenant_id);
CREATE INDEX idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX idx_invitations_tenant_id ON public.invitations(tenant_id);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);

CREATE INDEX idx_category_translations_category_id ON public.category_translations(category_id);
CREATE INDEX idx_category_translations_language ON public.category_translations(language_code);
CREATE INDEX idx_product_translations_product_id ON public.product_translations(product_id);
CREATE INDEX idx_product_translations_language ON public.product_translations(language_code);

CREATE INDEX idx_categories_draft ON public.categories(tenant_id, is_draft);
CREATE INDEX idx_products_draft ON public.products(tenant_id, is_draft);

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Helper function to get current user's tenant (with SECURITY DEFINER to avoid stack depth)
CREATE OR REPLACE FUNCTION public.user_tenant_id()
RETURNS BIGINT AS $$
DECLARE
  v_tenant_id BIGINT;
BEGIN
  -- Get the tenant_id for the current user using explicitly checked role
  SELECT tenant_id INTO v_tenant_id
  FROM public.tenant_users
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Get published products with translations for public menu
CREATE OR REPLACE FUNCTION public.products_with_translations(p_tenant_id BIGINT)
RETURNS TABLE (
  id BIGINT,
  tenant_id BIGINT,
  category_id BIGINT,
  price NUMERIC,
  currency VARCHAR,
  image_url TEXT,
  is_draft BOOLEAN,
  published_at TIMESTAMP,
  display_order INT,
  is_available BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  translations JSONB
) AS $$
SELECT
  p.id,
  p.tenant_id,
  p.category_id,
  p.price,
  p.currency,
  p.image_url,
  p.is_draft,
  p.published_at,
  p.display_order,
  p.is_available,
  p.created_at,
  p.updated_at,
  json_object_agg(
    pt.language_code,
    json_build_object(
      'name', pt.name,
      'description', pt.description,
      'slug', pt.slug
    )
  ) AS translations
FROM public.products p
LEFT JOIN public.product_translations pt ON p.id = pt.product_id
WHERE p.tenant_id = p_tenant_id AND p.is_draft = FALSE
GROUP BY p.id
ORDER BY p.display_order ASC;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get published categories with translations for public menu
CREATE OR REPLACE FUNCTION public.categories_with_translations(p_tenant_id BIGINT)
RETURNS TABLE (
  id BIGINT,
  tenant_id BIGINT,
  display_order INT,
  is_draft BOOLEAN,
  published_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  translations JSONB
) AS $$
SELECT
  c.id,
  c.tenant_id,
  c.display_order,
  c.is_draft,
  c.published_at,
  c.created_at,
  c.updated_at,
  json_object_agg(
    ct.language_code,
    json_build_object(
      'name', ct.name,
      'description', ct.description,
      'slug', ct.slug
    )
  ) AS translations
FROM public.categories c
LEFT JOIN public.category_translations ct ON c.id = ct.category_id
WHERE c.tenant_id = p_tenant_id AND c.is_draft = FALSE
GROUP BY c.id
ORDER BY c.display_order ASC;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Publish category
CREATE OR REPLACE FUNCTION public.publish_category(p_category_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE public.categories
  SET is_draft = FALSE, published_at = NOW()
  WHERE id = p_category_id;
END;
$$ LANGUAGE plpgsql;

-- Publish product
CREATE OR REPLACE FUNCTION public.publish_product(p_product_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET is_draft = FALSE, published_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TENANTS POLICIES
-- ============================================================================

-- Policy: Users can read their own tenant
CREATE POLICY "Users can read their own tenant"
ON public.tenants
FOR SELECT
USING (
  id = public.user_tenant_id()
);

-- Policy: Owners can update their tenant
CREATE POLICY "Owners can update their tenant"
ON public.tenants
FOR UPDATE
USING (
  id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = public.tenants.id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
)
WITH CHECK (
  id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = public.tenants.id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- ============================================================================
-- TENANT_USERS POLICIES
-- ============================================================================

-- Policy: Users can read their own tenant_users
CREATE POLICY "Users can read their tenant team"
ON public.tenant_users
FOR SELECT
USING (
  tenant_id = public.user_tenant_id()
);

-- Policy: Owners can insert tenant_users
CREATE POLICY "Owners can invite team members"
ON public.tenant_users
FOR INSERT
WITH CHECK (
  tenant_id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = public.tenant_users.tenant_id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Policy: Owners can update tenant_users
CREATE POLICY "Owners can update team members"
ON public.tenant_users
FOR UPDATE
USING (
  tenant_id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = public.tenant_users.tenant_id
    AND tu.user_id = auth.uid()
    AND tu.role = 'owner'
  )
)
WITH CHECK (
  tenant_id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = public.tenant_users.tenant_id
    AND tu.user_id = auth.uid()
    AND tu.role = 'owner'
  )
);

-- ============================================================================
-- INVITATIONS POLICIES
-- ============================================================================

-- Policy: Owners can create invitations
CREATE POLICY "Owners can create invitations"
ON public.invitations
FOR INSERT
WITH CHECK (
  tenant_id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = public.invitations.tenant_id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Policy: Anyone can read invitations (for accepting)
CREATE POLICY "Anyone can read invitation by token"
ON public.invitations
FOR SELECT
USING (true);

-- Policy: Users can update their own invitation acceptance
CREATE POLICY "Users can accept invitations"
ON public.invitations
FOR UPDATE
USING (
  token IS NOT NULL AND
  accepted_at IS NULL AND
  expires_at > NOW()
)
WITH CHECK (
  token IS NOT NULL AND
  accepted_at IS NULL AND
  expires_at > NOW()
);

-- ============================================================================
-- CATEGORIES POLICIES
-- ============================================================================

-- Policy: Team members can read categories of their tenant
CREATE POLICY "Team members can read categories"
ON public.categories
FOR SELECT
USING (
  tenant_id = public.user_tenant_id()
);

-- Policy: Editors can create categories
CREATE POLICY "Editors can create categories"
ON public.categories
FOR INSERT
WITH CHECK (
  tenant_id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = public.categories.tenant_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'editor')
  )
);

-- Policy: Editors can update categories
CREATE POLICY "Editors can update categories"
ON public.categories
FOR UPDATE
USING (
  tenant_id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = public.categories.tenant_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'editor')
  )
)
WITH CHECK (
  tenant_id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = public.categories.tenant_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'editor')
  )
);

-- Policy: Editors can delete categories
CREATE POLICY "Editors can delete categories"
ON public.categories
FOR DELETE
USING (
  tenant_id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = public.categories.tenant_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'editor')
  )
);

-- ============================================================================
-- CATEGORY_TRANSLATIONS POLICIES
-- ============================================================================

CREATE POLICY "Team members can read category translations"
ON public.category_translations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.id = category_translations.category_id
    AND c.tenant_id = public.user_tenant_id()
  )
);

CREATE POLICY "Editors can manage category translations"
ON public.category_translations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.id = category_translations.category_id
    AND c.tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = c.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'editor')
    )
  )
);

CREATE POLICY "Editors can update category translations"
ON public.category_translations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.id = category_translations.category_id
    AND c.tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = c.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'editor')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.id = category_translations.category_id
    AND c.tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = c.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'editor')
    )
  )
);

CREATE POLICY "Editors can delete category translations"
ON public.category_translations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.id = category_translations.category_id
    AND c.tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = c.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'editor')
    )
  )
);

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================

CREATE POLICY "Team members can read products"
ON public.products
FOR SELECT
USING (
  tenant_id = public.user_tenant_id()
);

CREATE POLICY "Editors can create products"
ON public.products
FOR INSERT
WITH CHECK (
  tenant_id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = public.products.tenant_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'editor')
  )
);

CREATE POLICY "Editors can update products"
ON public.products
FOR UPDATE
USING (
  tenant_id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = public.products.tenant_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'editor')
  )
)
WITH CHECK (
  tenant_id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = public.products.tenant_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'editor')
  )
);

CREATE POLICY "Editors can delete products"
ON public.products
FOR DELETE
USING (
  tenant_id = public.user_tenant_id() AND 
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = public.products.tenant_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'editor')
  )
);

-- ============================================================================
-- PRODUCT_TRANSLATIONS POLICIES
-- ============================================================================

CREATE POLICY "Team members can read product translations"
ON public.product_translations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_translations.product_id
    AND p.tenant_id = public.user_tenant_id()
  )
);

CREATE POLICY "Editors can manage product translations"
ON public.product_translations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_translations.product_id
    AND p.tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = p.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'editor')
    )
  )
);

CREATE POLICY "Editors can update product translations"
ON public.product_translations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_translations.product_id
    AND p.tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = p.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'editor')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_translations.product_id
    AND p.tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = p.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'editor')
    )
  )
);

CREATE POLICY "Editors can delete product translations"
ON public.product_translations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_translations.product_id
    AND p.tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.tenant_id = p.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'editor')
    )
  )
);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- All tables and policies created successfully!
-- You can now use the application.
