-- ============================================================================
-- QR ORDERING RUNTIME TOGGLE
-- ============================================================================
-- Ordering was only switchable at the *licensing* level, through
-- tenant_addons.orders_management. There was no way for a venue to turn QR
-- ordering off for itself — which the product promises ("dilerseniz QR
-- siparişi tek tuşla kapatırsınız — menü vitrin olur").
--
-- These are two distinct concepts and both must be true to accept an order:
--   tenant_addons.orders_management -> did they buy it   (our control)
--   tenants.qr_ordering_enabled     -> is it on right now (their control)
--
-- Defaults to TRUE so existing venues keep accepting orders after deploy.
--
-- Idempotent - safe to re-run.
-- ============================================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS qr_ordering_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.tenants.qr_ordering_enabled IS
  'Venue-controlled runtime switch for QR ordering. Independent of the '
  'orders_management addon, which controls whether the feature is licensed '
  'at all. Both must be true for an order to be accepted.';
