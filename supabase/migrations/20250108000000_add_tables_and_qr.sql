-- ============================================================================
-- TABLES & QR SYSTEM - DATABASE SCHEMA MIGRATION
-- ============================================================================
-- Adds table management system with UUID-based QR codes. Each table has a
-- unique UUID that encodes into a QR code URL (/order/{tenant_slug}/{table_id}).
-- Used for customers to place orders and for restaurants to manage seating.
--
-- Apply manually via the Supabase SQL Editor. Idempotent - safe to re-run.
-- ============================================================================

-- ============================================================================
-- 1. TABLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Display info
  label VARCHAR(100) NOT NULL,  -- e.g., "Masa 1", "Table A", "Outside - 3"
  display_order INT DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_tables_tenant
  ON public.tables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tables_display_order
  ON public.tables(tenant_id, display_order);

-- ============================================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Authenticated users (editors/owners) can manage their tenant's tables
DROP POLICY IF EXISTS "Users can read their tenant tables" ON public.tables;
CREATE POLICY "Users can read their tenant tables"
  ON public.tables FOR SELECT
  USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Editors can manage their tenant tables" ON public.tables;
CREATE POLICY "Editors can manage their tenant tables"
  ON public.tables FOR ALL
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
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Ops: Allow service role full access to tables" ON public.tables;
CREATE POLICY "Ops: Allow service role full access to tables"
  ON public.tables FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 3. MIGRATION LOG
-- ============================================================================

INSERT INTO public.migration_log (migration_name, version)
VALUES ('008_add_tables_and_qr', 1)
ON CONFLICT (migration_name) DO UPDATE
SET applied_at = NOW(), version = migration_log.version + 1;
