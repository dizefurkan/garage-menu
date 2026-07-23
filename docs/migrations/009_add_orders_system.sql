-- ============================================================================
-- ORDERS SYSTEM - DATABASE SCHEMA MIGRATION
-- ============================================================================
-- Adds full order management system with flexible status tracking.
-- order_statuses is tenant-scoped: each tenant has their own set of statuses,
-- seeded with defaults (Awaiting Approval, Approved, Preparing, Delivered, Cancelled)
-- but customizable. Orders track items, total amount, and verification method (WiFi/PIN/none).
--
-- Apply manually via the Supabase SQL Editor. Idempotent - safe to re-run.
-- ============================================================================

-- ============================================================================
-- 1. ORDER_STATUSES TABLE (tenant-scoped, customizable)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.order_statuses (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Identification
  key VARCHAR(100) NOT NULL,  -- e.g., 'awaiting_approval', 'preparing', 'delivered'
  label VARCHAR(255) NOT NULL,  -- e.g., "Onay Beklemede", "Hazırlanıyor"

  -- Display
  color VARCHAR(7) DEFAULT '#808080',  -- Hex color for UI
  sort_order INT DEFAULT 0,

  -- Flags
  is_terminal BOOLEAN DEFAULT FALSE,  -- True if order cannot move to another status (Delivered, Cancelled)
  is_default_seed BOOLEAN DEFAULT FALSE,  -- True if this status was created as part of default seed

  UNIQUE(tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_order_statuses_tenant
  ON public.order_statuses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_statuses_sort_order
  ON public.order_statuses(tenant_id, sort_order);

-- ============================================================================
-- 2. ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  status_id BIGINT NOT NULL REFERENCES public.order_statuses(id) ON DELETE RESTRICT,

  -- Customer input
  note TEXT,  -- Order-level note/special requests

  -- Totals
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'TRY',

  -- Verification
  verification_method VARCHAR(20) DEFAULT 'none',  -- 'wifi', 'pin', 'none'
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  estimated_ready_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant
  ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_table
  ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status
  ON public.orders(status_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON public.orders(tenant_id, created_at DESC);

-- ============================================================================
-- 3. ORDER_ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,

  -- Quantity & price snapshot
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,  -- Price at time of order

  -- Selected options/variants (JSON snapshot of chosen options)
  -- E.g., {"pişirme_derecesi": "orta", "porsiyon": "1.5x"}
  -- Stored as snapshot so price/availability changes don't affect past orders
  selected_options JSONB DEFAULT '{}',

  -- Item-level notes
  note TEXT,

  UNIQUE(order_id, product_id)  -- One product per order (quantity in quantity field)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON public.order_items(order_id);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.order_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- order_statuses: tenant users can read/edit their own
DROP POLICY IF EXISTS "Users can read their tenant order statuses" ON public.order_statuses;
CREATE POLICY "Users can read their tenant order statuses"
  ON public.order_statuses FOR SELECT
  USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Editors can manage their tenant order statuses" ON public.order_statuses;
CREATE POLICY "Editors can manage their tenant order statuses"
  ON public.order_statuses FOR ALL
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

DROP POLICY IF EXISTS "Ops: Allow service role full access to order statuses" ON public.order_statuses;
CREATE POLICY "Ops: Allow service role full access to order statuses"
  ON public.order_statuses FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- orders: tenant users can read/edit their own; public can insert (customer ordering)
DROP POLICY IF EXISTS "Users can read their tenant orders" ON public.orders;
CREATE POLICY "Users can read their tenant orders"
  ON public.orders FOR SELECT
  USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Editors can update their tenant orders" ON public.orders;
CREATE POLICY "Editors can update their tenant orders"
  ON public.orders FOR UPDATE
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

DROP POLICY IF EXISTS "Anyone can insert orders (customer ordering)" ON public.orders;
CREATE POLICY "Anyone can insert orders (customer ordering)"
  ON public.orders FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Ops: Allow service role full access to orders" ON public.orders;
CREATE POLICY "Ops: Allow service role full access to orders"
  ON public.orders FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- order_items: derived from parent order (tenant scope via orders -> tables -> tenant)
DROP POLICY IF EXISTS "Users can read order items from their tenant" ON public.order_items;
CREATE POLICY "Users can read order items from their tenant"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.tenant_id = public.user_tenant_id()
    )
  );

DROP POLICY IF EXISTS "Editors can manage order items" ON public.order_items;
CREATE POLICY "Editors can manage order items"
  ON public.order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.tenant_id = public.user_tenant_id()
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
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.tenant_id = public.user_tenant_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_id = public.user_tenant_id()
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Anyone can insert order items (customer ordering)" ON public.order_items;
CREATE POLICY "Anyone can insert order items (customer ordering)"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Ops: Allow service role full access to order items" ON public.order_items;
CREATE POLICY "Ops: Allow service role full access to order items"
  ON public.order_items FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 5. SEED: DEFAULT ORDER STATUSES FOR ALL TENANTS
-- ============================================================================

-- Use a DO block to seed default statuses for each tenant
DO $$
DECLARE
  tenant_rec RECORD;
  default_statuses RECORD;
BEGIN
  -- For each existing tenant, insert default statuses if they don't already exist.
  -- Simplified flow: Awaiting Approval -> Preparing -> Completed -> Cancelled
  -- (see 013_simplify_default_statuses.sql for the migration that applied
  -- this same simplification to tenants seeded before this change).
  FOR tenant_rec IN SELECT id FROM public.tenants WHERE is_active = true LOOP
    -- Awaiting Approval (yellow)
    INSERT INTO public.order_statuses (tenant_id, key, label, color, sort_order, is_default_seed)
    VALUES (tenant_rec.id, 'awaiting_approval', 'Onay Bekliyor', '#FCD34D', 1, true)
    ON CONFLICT (tenant_id, key) DO NOTHING;

    -- Preparing (orange)
    INSERT INTO public.order_statuses (tenant_id, key, label, color, sort_order, is_default_seed)
    VALUES (tenant_rec.id, 'preparing', 'Hazırlanıyor', '#FB923C', 2, true)
    ON CONFLICT (tenant_id, key) DO NOTHING;

    -- Completed (green)
    INSERT INTO public.order_statuses (tenant_id, key, label, color, sort_order, is_default_seed, is_terminal)
    VALUES (tenant_rec.id, 'completed', 'Tamamlandı', '#10B981', 3, true, true)
    ON CONFLICT (tenant_id, key) DO NOTHING;

    -- Cancelled (red)
    INSERT INTO public.order_statuses (tenant_id, key, label, color, sort_order, is_default_seed, is_terminal)
    VALUES (tenant_rec.id, 'cancelled', 'İptal Edildi', '#EF4444', 4, true, true)
    ON CONFLICT (tenant_id, key) DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- 6. MIGRATION LOG
-- ============================================================================

INSERT INTO public.migration_log (migration_name, version)
VALUES ('009_add_orders_system', 1)
ON CONFLICT (migration_name) DO UPDATE
SET applied_at = NOW(), version = migration_log.version + 1;
