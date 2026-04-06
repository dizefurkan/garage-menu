-- ============================================================================
-- MULTI-TENANT SAAS MENU SYSTEM - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- This schema supports multi-tenant menu management with:
-- - Tenant isolation via RLS (Row Level Security)
-- - Multi-language translations (separate tables)
-- - Draft/publish system for content
-- - User invitations for team collaboration
-- ============================================================================

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

-- ============================================================================
-- 1. AUTH & TENANTS
-- ============================================================================


-- Tenants (restaurants/businesses)
CREATE TABLE public.tenants (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Tenant identity
  slug VARCHAR(100) UNIQUE NOT NULL,  -- URL-safe identifier
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Branding & Settings
  theme_config JSONB DEFAULT '{"primary": "#000000", "secondary": "#FFFFFF"}',
  -- Example: { "primary": "#8B0333", "secondary": "#F2F0E9", "font": "serif" }
  
  languages TEXT[] DEFAULT '{"en","tr"}',  -- Supported languages
  default_language VARCHAR(5) DEFAULT 'en',
  
  -- Contact Information
  contact_info JSONB DEFAULT '{"address": "", "facebook": "", "instagram": "", "tiktok": "", "email": "", "whatsapp": ""}',
  -- Example: { "address": "123 Main St", "facebook": "facebook.com/page", "instagram": "@username", "tiktok": "@username", "email": "contact@example.com", "whatsapp": "+1234567890" }
  
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
  
  -- Relationships
  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role-based access
  role VARCHAR(20) NOT NULL DEFAULT 'editor',
  -- Roles: 'owner' (full access), 'editor' (CRUD products), 'viewer' (read-only)
  
  -- Status
  invited_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(tenant_id, user_id)
);

-- User invitations (for onboarding)
CREATE TABLE public.invitations (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Invite details
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,  -- Use nanoid or crypto.randomUUID()
  
  -- Relationships
  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Status
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
  
  -- Relationships
  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Metadata
  display_order INT DEFAULT 0,
  is_draft BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE public.category_translations (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relationships
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  
  -- Language & content
  language_code VARCHAR(5) NOT NULL,  -- 'en', 'tr', 'de', etc.
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255),  -- Optional: for URL-friendly slugs
  
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
  
  -- Relationships
  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- Product details
  price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',
  
  -- Media
  image_url TEXT,  -- File path in Supabase Storage
  
  -- Status
  is_draft BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  display_order INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  
  -- Tracking
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  
  CONSTRAINT price_positive CHECK (price >= 0)
);

CREATE TABLE public.product_translations (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relationships
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Language & content
  language_code VARCHAR(5) NOT NULL,  -- 'en', 'tr', 'de', etc.
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255),  -- URL-friendly slug per language
  
  UNIQUE(product_id, language_code),
  CONSTRAINT language_code_format CHECK (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

-- ============================================================================
-- 4. INDEXES (for performance)
-- ============================================================================

-- Multi-tenant query optimization
CREATE INDEX idx_categories_tenant_id ON public.categories(tenant_id);
CREATE INDEX idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX idx_invitations_tenant_id ON public.invitations(tenant_id);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);

-- Translation lookups
CREATE INDEX idx_category_translations_category_id ON public.category_translations(category_id);
CREATE INDEX idx_category_translations_language ON public.category_translations(language_code);
CREATE INDEX idx_product_translations_product_id ON public.product_translations(product_id);
CREATE INDEX idx_product_translations_language ON public.product_translations(language_code);

-- Draft/publish queries
CREATE INDEX idx_categories_draft ON public.categories(tenant_id, is_draft);
CREATE INDEX idx_products_draft ON public.products(tenant_id, is_draft);

-- ============================================================================
-- 5. VIEWS (for convenient queries)
-- ============================================================================

-- Get published products with translations for public menu (SECURITY DEFINER for public API)
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

-- Get published categories with translations for public menu (SECURITY DEFINER for public API)
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

-- ============================================================================
-- 6. FUNCTIONS (for business logic)
-- ============================================================================

-- Mark content as published
CREATE OR REPLACE FUNCTION public.publish_category(p_category_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE public.categories
  SET is_draft = FALSE, published_at = NOW()
  WHERE id = p_category_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.publish_product(p_product_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET is_draft = FALSE, published_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
