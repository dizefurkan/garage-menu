-- ============================================================================
-- CATEGORY IMAGES + MENU LAYOUT + SORTING
-- ============================================================================
-- Three related gaps:
--
--   1. categories had no image and no display_order at all — the table held
--      only (id, tenant_id, created_at, updated_at), with the name living in
--      category_translations. A category-first menu makes both visible.
--   2. products had no display_order either, so "manual order" was not
--      expressible for products or categories.
--   3. There was no way to choose how the public menu is laid out or ordered.
--
-- Menu layout is a *theme* choice, not a paid addon: it is surfaced under
-- Settings -> Theme next to colours and fonts, and every venue has it.
--
-- Idempotent - safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Category image + ordering
-- ----------------------------------------------------------------------------

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.categories.image_url IS
  'Banner image for the category-first menu layout. Rendered wide (21:9-ish), '
  'so uploads should be landscape. NULL falls back to a plain tile.';

-- ----------------------------------------------------------------------------
-- 2. Product ordering
-- ----------------------------------------------------------------------------

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- ----------------------------------------------------------------------------
-- 3. Tenant-level menu presentation
-- ----------------------------------------------------------------------------

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS menu_layout TEXT NOT NULL DEFAULT 'products';

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS category_sort TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS product_sort TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_menu_layout_valid;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_menu_layout_valid
  CHECK (menu_layout IN ('products', 'categories'));

ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_category_sort_valid;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_category_sort_valid
  CHECK (category_sort IN ('manual', 'alphabetical', 'popularity'));

-- Products get two extra modes categories cannot have: price has no meaning
-- for a category, and "newest" is far more useful on items than on sections.
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_product_sort_valid;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_product_sort_valid
  CHECK (product_sort IN (
    'manual', 'alphabetical', 'popularity', 'price_asc', 'price_desc', 'newest'
  ));

COMMENT ON COLUMN public.tenants.menu_layout IS
  'products = current flat menu; categories = category-first landing screen. '
  'Chosen under Settings -> Theme.';

COMMENT ON COLUMN public.tenants.category_sort IS
  'How categories are ordered on the public menu. `popularity` needs order '
  'data and silently falls back to `manual` when unavailable.';

-- ----------------------------------------------------------------------------
-- 4. Indexes for the ordered reads
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_categories_tenant_order
  ON public.categories(tenant_id, display_order);

CREATE INDEX IF NOT EXISTS idx_products_category_order
  ON public.products(category_id, display_order);
