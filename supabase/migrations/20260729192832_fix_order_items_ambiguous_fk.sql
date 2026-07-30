-- ============================================================================
-- FIX: AMBIGUOUS orders -> order_items RELATIONSHIP
-- ============================================================================
-- Regression from 20260727214643. Adding the composite foreign key
--
--   order_items (order_id, tenant_id) -> orders (id, tenant_id)
--
-- left order_items with *two* foreign keys pointing at orders: the original
-- single-column order_items_order_id_fkey and the new composite one. PostgREST
-- then refuses to embed, since it cannot tell which relationship is meant:
--
--   PGRST201: Could not embed because more than one relationship was found
--
-- That broke every admin query selecting `orders(..., order_items(...))`, i.e.
-- the whole orders page.
--
-- The single-column key is now redundant: the composite key already guarantees
-- order_id references a real order, and carries the same ON DELETE CASCADE.
-- Dropping it leaves exactly one path and restores the embed, while keeping
-- the tenant-mismatch guarantee that was the point of the original change.
--
-- Idempotent - safe to re-run.
-- ============================================================================

ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

-- Re-assert the composite key so a re-run on a database that never had it
-- still ends in the intended state.
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_tenant_matches_order;
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_tenant_matches_order
  FOREIGN KEY (order_id, tenant_id)
  REFERENCES public.orders (id, tenant_id)
  ON DELETE CASCADE;
