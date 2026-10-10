-- ============================================================================
-- ORDER PIN REQUIRED TOGGLE
-- ============================================================================
-- Once a PIN existed there was no way to stop asking for it: guests off the
-- venue WiFi always had to enter it, and verification could not be turned off.
--
-- order_pin_required = TRUE  -> current behaviour: registered WiFi IP or the
--                               PIN verifies an order.
-- order_pin_required = FALSE -> no verification; anyone who scans the QR code
--                               can place an order.
--
-- Defaults to TRUE so existing venues keep verifying orders after deploy.
--
-- Idempotent - safe to re-run.
-- ============================================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS order_pin_required BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.tenants.order_pin_required IS
  'When FALSE, orders are accepted without WiFi/PIN verification.';
