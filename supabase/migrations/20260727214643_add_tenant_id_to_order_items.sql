-- ============================================================================
-- ORDER_ITEMS: TENANT ISOLATION FIX
-- ============================================================================
-- order_items was the only multi-tenant table without a tenant_id column. Its
-- RLS policies reached the tenant through a subquery on orders, which is both
-- slower (a lookup per row) and easy to get wrong in new queries — a missed
-- join leaks rows across tenants.
--
-- This migration denormalises tenant_id onto order_items and then makes drift
-- structurally impossible via a composite foreign key, so a wrong tenant_id is
-- a database error rather than a silent leak.
--
-- Idempotent - safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Column (nullable first, so existing rows can be backfilled)
-- ----------------------------------------------------------------------------

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS tenant_id BIGINT;

-- ----------------------------------------------------------------------------
-- 2. Backfill from the parent order
-- ----------------------------------------------------------------------------

UPDATE public.order_items oi
   SET tenant_id = o.tenant_id
  FROM public.orders o
 WHERE oi.order_id = o.id
   AND oi.tenant_id IS DISTINCT FROM o.tenant_id;

ALTER TABLE public.order_items
  ALTER COLUMN tenant_id SET NOT NULL;

-- ----------------------------------------------------------------------------
-- 3. Composite FK — the actual guarantee
-- ----------------------------------------------------------------------------
-- Requires a unique target on orders. orders.id is already the primary key, so
-- (id, tenant_id) is trivially unique; the constraint just exposes it as a
-- referencable key.

-- Drop order matters on a re-run: the composite FK below depends on this
-- unique constraint, so the dependent FK has to go first or the DROP fails
-- with "cannot drop ... because other objects depend on it".
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_tenant_matches_order;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_id_tenant_uniq;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_id_tenant_uniq UNIQUE (id, tenant_id);

-- With this in place an order_items row whose tenant_id disagrees with its
-- parent order's tenant_id cannot be inserted at all.
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_tenant_matches_order
  FOREIGN KEY (order_id, tenant_id)
  REFERENCES public.orders (id, tenant_id)
  ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- 4. Auto-populate, so existing insert paths need no change
-- ----------------------------------------------------------------------------
-- app/api/order/route.ts inserts order_items without a tenant_id. Rather than
-- rely on every current and future call site remembering the column, derive it
-- from the parent order. A caller that *does* pass tenant_id is left alone —
-- the composite FK above still validates it.

CREATE OR REPLACE FUNCTION public.set_order_item_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT o.tenant_id INTO NEW.tenant_id
      FROM public.orders o
     WHERE o.id = NEW.order_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_set_tenant_id ON public.order_items;
CREATE TRIGGER trg_order_items_set_tenant_id
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_item_tenant_id();

-- ----------------------------------------------------------------------------
-- 5. Indexes
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_order_items_tenant
  ON public.order_items(tenant_id);

-- Supports the co-occurrence query behind product recommendations
-- (pairs of products appearing in the same order, scoped to one tenant).
CREATE INDEX IF NOT EXISTS idx_order_items_tenant_order
  ON public.order_items(tenant_id, order_id);

-- ----------------------------------------------------------------------------
-- 6. RLS policies — now a direct comparison instead of a subquery on orders
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can read order items from their tenant" ON public.order_items;
CREATE POLICY "Users can read order items from their tenant"
  ON public.order_items FOR SELECT
  USING (tenant_id = public.user_tenant_id());

DROP POLICY IF EXISTS "Editors can manage order items" ON public.order_items;
CREATE POLICY "Editors can manage order items"
  ON public.order_items FOR ALL
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

-- The public/anon insert policy (customer ordering) is intentionally left as
-- it was: an anonymous customer has no user_tenant_id(), so tenant_id cannot
-- be checked against it. The composite FK is what protects that path — the
-- trigger fills tenant_id from the order, and a mismatched value is rejected.
