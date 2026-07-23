-- ============================================================================
-- ENABLE REALTIME FOR ORDERS - DATABASE SCHEMA MIGRATION
-- ============================================================================
-- Adds the `orders` table to the `supabase_realtime` publication so that
-- postgres_changes events (INSERT/UPDATE) are broadcast over Supabase
-- Realtime. Without this, the admin orders page's realtime subscription
-- never receives any events regardless of RLS/client auth.
--
-- Apply manually via the Supabase SQL Editor. Idempotent - safe to re-run.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- ============================================================================
-- MIGRATION LOG
-- ============================================================================

INSERT INTO public.migration_log (migration_name, version)
VALUES ('012_enable_orders_realtime', 1)
ON CONFLICT (migration_name) DO UPDATE
SET applied_at = NOW(), version = migration_log.version + 1;
