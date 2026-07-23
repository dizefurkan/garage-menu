-- ============================================================================
-- SIMPLIFY DEFAULT ORDER STATUSES
-- ============================================================================
-- Simplifies the default order flow from
--   Awaiting Approval -> Approved -> Preparing -> Delivered -> Cancelled
-- to
--   Awaiting Approval -> Preparing -> Completed -> Cancelled
--
-- - Renames the default-seeded 'delivered' status to 'completed' /
--   "Tamamlandı" and re-numbers sort_order.
-- - Removes the default-seeded 'approved' status where it isn't referenced
--   by any existing order (FK RESTRICT protects orders still using it —
--   those are left untouched rather than failing the migration).
--
-- Apply manually via the Supabase SQL Editor. Idempotent - safe to re-run.
-- ============================================================================

-- Rename 'delivered' -> 'completed' for default-seeded statuses only,
-- leaving any tenant-custom status with that key untouched.
UPDATE public.order_statuses
SET key = 'completed', label = 'Tamamlandı', sort_order = 3, is_terminal = true
WHERE key = 'delivered' AND is_default_seed = true;

-- Re-number the remaining default-seeded steps.
UPDATE public.order_statuses
SET sort_order = 1
WHERE key = 'awaiting_approval' AND is_default_seed = true;

UPDATE public.order_statuses
SET sort_order = 2
WHERE key = 'preparing' AND is_default_seed = true;

UPDATE public.order_statuses
SET sort_order = 4
WHERE key = 'cancelled' AND is_default_seed = true;

-- Drop the now-unused 'approved' step for tenants where no order
-- references it. Loop per-row so a single FK-restricted status doesn't
-- abort the whole migration.
DO $$
DECLARE
  status_rec RECORD;
BEGIN
  FOR status_rec IN
    SELECT id FROM public.order_statuses
    WHERE key = 'approved' AND is_default_seed = true
  LOOP
    BEGIN
      DELETE FROM public.order_statuses WHERE id = status_rec.id;
    EXCEPTION WHEN foreign_key_violation THEN
      -- Still referenced by an existing order; leave it in place.
      NULL;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- MIGRATION LOG
-- ============================================================================

INSERT INTO public.migration_log (migration_name, version)
VALUES ('013_simplify_default_statuses', 1)
ON CONFLICT (migration_name) DO UPDATE
SET applied_at = NOW(), version = migration_log.version + 1;
