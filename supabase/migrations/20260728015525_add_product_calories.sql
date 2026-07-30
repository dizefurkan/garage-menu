-- ============================================================================
-- PRODUCT CALORIES (BASE VALUE)
-- ============================================================================
-- Sits alongside the existing allergen data as the second piece of nutrition
-- information on a product. Nullable on purpose: most venues will never fill
-- it in, and NULL means "not declared" — the menu then shows nothing at all
-- rather than "0 kcal", which would be a false claim.
--
-- Deliberately base-only for now. The agreed model also gives each option
-- group a calorie mode (absolute for size variants, delta for add-ons), but
-- the product option system currently has no admin or customer UI and zero
-- rows in either table, so those columns would have no way to be filled.
-- They land together with that UI.
--
-- Idempotent - safe to re-run.
-- ============================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS calories INTEGER;

COMMENT ON COLUMN public.products.calories IS
  'Base calorie count (kcal) for the product as listed. NULL means the venue '
  'has not declared it; the menu then shows no calorie information.';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_calories_non_negative;
ALTER TABLE public.products
  ADD CONSTRAINT products_calories_non_negative
  CHECK (calories IS NULL OR calories >= 0);
