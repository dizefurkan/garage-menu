-- ============================================================================
-- LICENSING & ADDON SYSTEM - DATABASE SCHEMA MIGRATION
-- ============================================================================
-- Adds multi-tier plan system (plans, addons, tenant_addons) to support
-- feature-gating and future upselling. Plans are base packages (e.g., Basic QR-only),
-- addons are ala-carte features (e.g., Orders & Tables). Tenants subscribe to
-- a plan and can enable/disable addons independently.
--
-- Apply manually via the Supabase SQL Editor. Idempotent - safe to re-run.
-- ============================================================================

-- ============================================================================
-- 1. PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plans (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Identification
  key VARCHAR(100) UNIQUE NOT NULL,  -- e.g., 'basic', 'pro', 'enterprise'
  name VARCHAR(255) NOT NULL,        -- e.g., 'Basic QR Menu'

  -- Pricing
  price_monthly NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',

  -- Features
  features JSONB DEFAULT '{}',      -- e.g., {"max_products": 100, "has_analytics": false}

  -- Status & display
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  description TEXT
);

-- ============================================================================
-- 2. ADDONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.addons (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Identification
  key VARCHAR(100) UNIQUE NOT NULL,  -- e.g., 'orders_management', 'reservations'
  name VARCHAR(255) NOT NULL,

  -- Pricing
  price_monthly NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TRY',

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0
);

-- ============================================================================
-- 3. TENANT_ADDONS TABLE (join table for many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_addons (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  addon_key VARCHAR(100) NOT NULL,  -- Foreign key to addons.key (soft FK for flexibility)

  enabled BOOLEAN DEFAULT TRUE,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,  -- For trial periods, subscription end dates

  UNIQUE(tenant_id, addon_key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_addons_tenant
  ON public.tenant_addons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_addons_addon_key
  ON public.tenant_addons(addon_key);

-- ============================================================================
-- 4. ADD PLAN REFERENCE TO TENANTS
-- ============================================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS plan_id BIGINT REFERENCES public.plans(id) ON DELETE SET NULL;

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_addons ENABLE ROW LEVEL SECURITY;

-- Plans: publicly readable (for landing page), service role can write
DROP POLICY IF EXISTS "Anyone can read plans" ON public.plans;
CREATE POLICY "Anyone can read plans"
  ON public.plans FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Ops: Allow service role full access to plans" ON public.plans;
CREATE POLICY "Ops: Allow service role full access to plans"
  ON public.plans FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Addons: publicly readable, service role can write
DROP POLICY IF EXISTS "Anyone can read addons" ON public.addons;
CREATE POLICY "Anyone can read addons"
  ON public.addons FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Ops: Allow service role full access to addons" ON public.addons;
CREATE POLICY "Ops: Allow service role full access to addons"
  ON public.addons FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- tenant_addons: tenant users can read their own; service role can write all
DROP POLICY IF EXISTS "Users can read their tenant addons" ON public.tenant_addons;
CREATE POLICY "Users can read their tenant addons"
  ON public.tenant_addons FOR SELECT
  USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Ops: Allow service role full access to tenant_addons" ON public.tenant_addons;
CREATE POLICY "Ops: Allow service role full access to tenant_addons"
  ON public.tenant_addons FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 6. SEED: DEFAULT PLANS & ADDONS
-- ============================================================================

INSERT INTO public.plans (key, name, price_monthly, currency, description, display_order)
VALUES
  ('basic', 'Basic QR Menu', 200.00, 'TRY', 'Digital menu via QR code', 1),
  ('pro', 'Pro QR + 3D Models', 250.00, 'TRY', 'Digital menu with 3D product models', 2),
  ('enterprise', 'Enterprise', 500.00, 'TRY', 'Custom features and support', 3)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.addons (key, name, price_monthly, currency, description, display_order)
VALUES
  ('orders_management', 'Orders & Table Management', 150.00, 'TRY', 'Full order management with tables, QR-based ordering, and live notifications', 1),
  ('analytics', 'Advanced Analytics', 100.00, 'TRY', 'Detailed sales and customer analytics', 2)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 7. MIGRATION LOG
-- ============================================================================

INSERT INTO public.migration_log (migration_name, version)
VALUES ('007_add_licensing', 1)
ON CONFLICT (migration_name) DO UPDATE
SET applied_at = NOW(), version = migration_log.version + 1;
