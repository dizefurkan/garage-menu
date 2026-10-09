-- ============================================================================
-- CATEGORY GRID COLUMNS
-- ============================================================================
-- How many category cards sit side by side on the category-first menu
-- landing screens: 1 (wide banners, the original look) or 2 (compact tiles).
-- A theme choice like menu_layout, so it lives on tenants.
--
-- Idempotent - safe to re-run.
-- ============================================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS category_grid_columns SMALLINT NOT NULL DEFAULT 1;

ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_category_grid_columns_valid;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_category_grid_columns_valid
  CHECK (category_grid_columns IN (1, 2));

COMMENT ON COLUMN public.tenants.category_grid_columns IS
  'Category cards per row on the category-first menu: 1 = wide banners, 2 = two-up tiles.';
