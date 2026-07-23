-- ============================================================================
-- PRODUCT OPTIONS & VARIANTS - DATABASE SCHEMA MIGRATION
-- ============================================================================
-- Adds flexible product customization system supporting both free selections
-- (e.g., Rare/Medium/Well-done burger) and price-varying options (e.g., portion
-- sizes: 1x/1.5x/2x, or bread type: half/3-quarter/full). Used in order flow
-- when customers select products.
--
-- Apply manually via the Supabase SQL Editor. Idempotent - safe to re-run.
-- ============================================================================

-- ============================================================================
-- 1. PRODUCT_OPTION_GROUPS TABLE
-- ============================================================================
-- Groups related options together (e.g., "Pişirme Derecesi" or "Porsiyon")

CREATE TABLE IF NOT EXISTS public.product_option_groups (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- Identification
  name VARCHAR(255) NOT NULL,  -- e.g., "Pişirme Derecesi", "Porsiyon", "Ekmek Tipi"

  -- Configuration
  selection_type VARCHAR(20) NOT NULL DEFAULT 'single',  -- 'single' or 'multiple'
  is_required BOOLEAN DEFAULT FALSE,  -- Must customer choose from this group?

  -- Display
  display_order INT DEFAULT 0,

  UNIQUE(product_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_option_groups_product
  ON public.product_option_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_product_option_groups_tenant
  ON public.product_option_groups(tenant_id);

-- ============================================================================
-- 2. PRODUCT_OPTION_VALUES TABLE
-- ============================================================================
-- Individual options within a group, each with optional price delta

CREATE TABLE IF NOT EXISTS public.product_option_values (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  group_id BIGINT NOT NULL REFERENCES public.product_option_groups(id) ON DELETE CASCADE,

  -- Name of the choice
  name VARCHAR(255) NOT NULL,  -- e.g., "Az Pişmiş", "Orta", "Iyi Pişmiş" or "1.5x", "Yarım Ekmek"

  -- Price modifier (can be negative or positive)
  -- If null or 0, this option doesn't change the product price
  price_delta NUMERIC(10, 2) DEFAULT 0.00,

  -- Display & selection
  display_order INT DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,  -- Pre-selected in customer UI

  UNIQUE(group_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_option_values_group
  ON public.product_option_values(group_id);

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;

-- product_option_groups: tenant users can read/edit their own
DROP POLICY IF EXISTS "Users can read option groups from their tenant products" ON public.product_option_groups;
CREATE POLICY "Users can read option groups from their tenant products"
  ON public.product_option_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.tenant_id = public.user_tenant_id()
    )
  );

DROP POLICY IF EXISTS "Editors can manage option groups" ON public.product_option_groups;
CREATE POLICY "Editors can manage option groups"
  ON public.product_option_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.tenant_id = public.user_tenant_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.tenant_id = public.user_tenant_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Ops: Allow service role full access to option groups" ON public.product_option_groups;
CREATE POLICY "Ops: Allow service role full access to option groups"
  ON public.product_option_groups FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- product_option_values: derived from parent group
DROP POLICY IF EXISTS "Users can read option values from their tenant" ON public.product_option_values;
CREATE POLICY "Users can read option values from their tenant"
  ON public.product_option_values FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.product_option_groups g
      JOIN public.products p ON p.id = g.product_id
      WHERE g.id = group_id
        AND p.tenant_id = public.user_tenant_id()
    )
  );

DROP POLICY IF EXISTS "Editors can manage option values" ON public.product_option_values;
CREATE POLICY "Editors can manage option values"
  ON public.product_option_values FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.product_option_groups g
      JOIN public.products p ON p.id = g.product_id
      WHERE g.id = group_id
        AND p.tenant_id = public.user_tenant_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_option_groups g
      JOIN public.products p ON p.id = g.product_id
      WHERE g.id = group_id
        AND p.tenant_id = public.user_tenant_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Ops: Allow service role full access to option values" ON public.product_option_values;
CREATE POLICY "Ops: Allow service role full access to option values"
  ON public.product_option_values FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 4. MIGRATION LOG
-- ============================================================================

INSERT INTO public.migration_log (migration_name, version)
VALUES ('010_add_product_options', 1)
ON CONFLICT (migration_name) DO UPDATE
SET applied_at = NOW(), version = migration_log.version + 1;
