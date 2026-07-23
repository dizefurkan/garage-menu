-- ============================================================================
-- WiFi & PIN VERIFICATION - DATABASE SCHEMA MIGRATION
-- ============================================================================
-- Adds network verification columns to tenants table to support WiFi-based
-- auto-approval and daily PIN verification for order submissions.
--
-- Apply manually via the Supabase SQL Editor. Idempotent - safe to re-run.
-- ============================================================================

-- ============================================================================
-- 1. ADD COLUMNS TO TENANTS
-- ============================================================================

-- Public IP address of the restaurant's network (set once via admin panel)
-- When a customer submits an order from this IP, no PIN is required.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS verified_network_ip VARCHAR(45);

-- Daily PIN code for order verification (4 digits, e.g., "1234")
-- Set/renewed daily or manually via admin panel
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS order_pin_code VARCHAR(4);

-- Date the PIN was generated (used to detect daily expiry)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS order_pin_date DATE;

-- ============================================================================
-- 2. MIGRATION LOG
-- ============================================================================

INSERT INTO public.migration_log (migration_name, version)
VALUES ('011_add_wifi_pin_verification', 1)
ON CONFLICT (migration_name) DO UPDATE
SET applied_at = NOW(), version = migration_log.version + 1;
