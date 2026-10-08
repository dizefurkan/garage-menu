-- ============================================================================
-- CATEGORY PARENT (one level of sub-categories)
-- ============================================================================
-- "Kahvaltılar" -> "Serpme kahvaltı", "Tostlar", "Omletler".
--
-- Exactly one level: a category with a parent cannot itself be a parent. The
-- admin API validates this with friendly errors; the trigger below is the
-- backstop so no other writer can build a deeper tree or cross tenants.
--
-- ON DELETE RESTRICT: removing a parent that still has children must be a
-- deliberate act (the admin API returns CATEGORY_HAS_CHILDREN), never a
-- silent cascade or orphaning.
--
-- Idempotent - safe to re-run.
-- ============================================================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id BIGINT
  REFERENCES public.categories(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id
  ON public.categories(parent_id);

COMMENT ON COLUMN public.categories.parent_id IS
  'Optional parent category (one level only). NULL = top-level category.';

CREATE OR REPLACE FUNCTION public.validate_category_parent()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  parent_row RECORD;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'A category cannot be its own parent';
  END IF;

  SELECT tenant_id, parent_id INTO parent_row
  FROM public.categories WHERE id = NEW.parent_id;

  IF parent_row.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
    RAISE EXCEPTION 'Parent category must belong to the same tenant';
  END IF;

  IF parent_row.parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Only one level of sub-categories is supported';
  END IF;

  IF EXISTS (SELECT 1 FROM public.categories WHERE parent_id = NEW.id) THEN
    RAISE EXCEPTION 'A category that has sub-categories cannot get a parent';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_category_parent ON public.categories;
CREATE TRIGGER trg_validate_category_parent
  BEFORE INSERT OR UPDATE OF parent_id ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.validate_category_parent();
