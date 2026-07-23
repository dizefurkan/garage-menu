-- ============================================================================
-- ORDER STATUS ENABLE/DISABLE TOGGLE
-- ============================================================================
-- Order statuses are now a fixed catalog (Awaiting Approval, Preparing,
-- Completed, Cancelled) instead of freely tenant-created. Tenants can only
-- toggle which of these are enabled/visible, not create or delete new ones.
--
-- Apply manually via the Supabase SQL Editor. Idempotent - safe to re-run.
-- ============================================================================

ALTER TABLE public.order_statuses
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT true;

-- ============================================================================
-- MIGRATION LOG
-- ============================================================================

INSERT INTO public.migration_log (migration_name, version)
VALUES ('014_order_status_toggle', 1)
ON CONFLICT (migration_name) DO UPDATE
SET applied_at = NOW(), version = migration_log.version + 1;
