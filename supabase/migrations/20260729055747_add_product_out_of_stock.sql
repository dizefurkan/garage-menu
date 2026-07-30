-- ============================================================================
-- PRODUCT: OUT OF STOCK (SEPARATE FROM HIDDEN)
-- ============================================================================
-- Closing a product for sale and running out of it are different intentions
-- and need different outcomes on the menu:
--
--   is_available = false            -> not on the menu at all
--   is_available = true,
--     is_out_of_stock = true        -> on the menu, labelled, not orderable
--   is_available = true,
--     is_out_of_stock = false       -> normal
--
-- Hidden wins if both are set: there is nothing to label if the item isn't
-- rendered. The admin surfaces these two booleans as a single three-way
-- control so a venue never has to reason about the combination.
--
-- `is_available` keeps its exact current meaning, so the ~8 existing call
-- sites that read or write it are unaffected.
--
-- Idempotent - safe to re-run.
-- ============================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_out_of_stock BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.products.is_out_of_stock IS
  'Sold out: still rendered on the public menu with a label, but cannot be '
  'ordered. Distinct from is_available=false, which hides the product '
  'entirely. Hidden takes precedence over out-of-stock.';

-- Ordering reads this to sink sold-out items to the bottom of their category.
CREATE INDEX IF NOT EXISTS idx_products_category_stock
  ON public.products(category_id, is_out_of_stock);
