-- ============================================================
-- Migration 015: Enable RLS on unrestricted tables
-- ============================================================
-- Supabase dashboard flags these as UNRESTRICTED:
--   tenants, tenant_users, categories, category_translations,
--   products, product_translations, migration_log,
--   analytics_* (materialized views)
--
-- Policies already exist on the core tables but RLS was never
-- enabled — the tenant_users policies are self-referencing,
-- which raises "infinite recursion detected in policy" as soon
-- as RLS turns on. Fix: SECURITY DEFINER helper functions
-- (same pattern as the existing user_tenant_id()).
--
-- Materialized views cannot have RLS; instead revoke API-role
-- access — the app only reads them with the service role key.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Helper functions (bypass RLS to avoid policy recursion)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_tenant_member(t_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = t_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_owner(t_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_id = t_id AND user_id = auth.uid()
      AND role = 'owner'
  );
$$;

REVOKE ALL ON FUNCTION public.is_tenant_member(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_tenant_owner(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(BIGINT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_owner(BIGINT) TO authenticated, anon, service_role;

-- ------------------------------------------------------------
-- 2. Rewrite self-recursive tenant_users policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can select own tenant members" ON public.tenant_users;
CREATE POLICY "Users can select own tenant members"
  ON public.tenant_users FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR public.is_tenant_member(tenant_id)
  );

DROP POLICY IF EXISTS "Tenant owners can insert new members" ON public.tenant_users;
CREATE POLICY "Tenant owners can insert new members"
  ON public.tenant_users FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_tenant_owner(tenant_id)
  );

DROP POLICY IF EXISTS "Tenant owners can update members" ON public.tenant_users;
CREATE POLICY "Tenant owners can update members"
  ON public.tenant_users FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR public.is_tenant_member(tenant_id)
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_tenant_owner(tenant_id)
  );

-- tenants policies also subquery tenant_users; rewrite with the
-- helpers so they don't depend on tenant_users RLS evaluation.
DROP POLICY IF EXISTS user_select_own_tenant ON public.tenants;
CREATE POLICY user_select_own_tenant
  ON public.tenants FOR SELECT
  USING (public.is_tenant_member(id));

DROP POLICY IF EXISTS owner_update_tenant ON public.tenants;
CREATE POLICY owner_update_tenant
  ON public.tenants FOR UPDATE
  USING (public.is_tenant_owner(id));

-- ------------------------------------------------------------
-- 3. Enable RLS (policies already exist on these tables)
-- ------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;

-- migration_log: internal bookkeeping, service-role only.
-- RLS on with no policies = deny all API roles (service role
-- bypasses RLS).
ALTER TABLE public.migration_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.migration_log FROM anon, authenticated;

-- ------------------------------------------------------------
-- 4. Analytics materialized views: no RLS support, so remove
--    API-role access entirely (read server-side via service role)
-- ------------------------------------------------------------
REVOKE ALL ON public.analytics_daily_summary FROM anon, authenticated;
REVOKE ALL ON public.analytics_product_heatmap FROM anon, authenticated;
REVOKE ALL ON public.analytics_category_heatmap FROM anon, authenticated;
REVOKE ALL ON public.analytics_device_breakdown FROM anon, authenticated;
REVOKE ALL ON public.analytics_geographic_breakdown FROM anon, authenticated;
REVOKE ALL ON public.analytics_referrer_breakdown FROM anon, authenticated;

-- ------------------------------------------------------------
-- 5. Migration log
-- ------------------------------------------------------------
INSERT INTO public.migration_log (migration_name, version)
VALUES ('015_enable_rls_security', 1)
ON CONFLICT (migration_name) DO UPDATE
SET applied_at = NOW(), version = migration_log.version + 1;
