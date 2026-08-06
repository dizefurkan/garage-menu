-- ============================================================================
-- BULK PERCENTAGE PRICE ADJUSTMENT
-- ============================================================================
-- Applies a percentage increase/decrease to many products at once.
--
-- Why a function instead of a loop in the route handler:
--
--   1. PostgREST cannot express `price = price * 1.1` — an expression update
--      is not representable in its filter/update API. Doing it from Node means
--      reading every row and issuing one UPDATE per product; a 300-item menu
--      becomes 300 round trips and is not atomic, so a failure halfway leaves
--      half the menu repriced.
--   2. Preview and apply MUST agree. This operation is irreversible, so the
--      user is shown the new prices before committing. If the preview were
--      computed in JS and the write in SQL, the two could drift (rounding,
--      float vs numeric) and the user would approve numbers we never wrote.
--      One function in dry-run mode is literally the same code path.
--
-- Both modes RETURN the affected rows, so the caller renders the preview from
-- the same result shape it later gets back from the real run.
--
-- Idempotent - safe to re-run.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.bulk_adjust_product_prices(
  p_tenant_id   BIGINT,
  p_percent     NUMERIC,
  p_updated_by  UUID,
  p_rounding    TEXT     DEFAULT 'cent',
  p_dry_run     BOOLEAN  DEFAULT TRUE,
  -- Scope. Either an explicit id list, or "everything matching the filter".
  -- The two are mutually exclusive; p_product_ids wins when both are given.
  p_product_ids BIGINT[] DEFAULT NULL,
  p_category_id BIGINT   DEFAULT NULL,
  p_exclude_ids BIGINT[] DEFAULT NULL
)
RETURNS TABLE (
  id        BIGINT,
  old_price NUMERIC,
  new_price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_digits INT;
BEGIN
  -- -100% zeroes a price, which the price_positive CHECK still allows, but
  -- anything beyond that would mean negative money. Reject rather than clamp:
  -- silently turning -150% into 0 is not what the user asked for.
  IF p_percent IS NULL OR p_percent < -100 OR p_percent > 1000 THEN
    RAISE EXCEPTION 'percent out of range: %', p_percent
      USING ERRCODE = 'check_violation';
  END IF;

  v_digits := CASE p_rounding
    WHEN 'cent'  THEN 2   -- exact kurus
    WHEN 'whole' THEN 0   -- nearest whole unit of currency
    ELSE NULL
  END;

  IF v_digits IS NULL THEN
    RAISE EXCEPTION 'unknown rounding mode: %', p_rounding
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN QUERY
  WITH scope AS (
    SELECT
      p.id AS product_id,
      p.price AS current_price,
      -- GREATEST guards the price_positive CHECK: at exactly -100% the
      -- product becomes free, never negative.
      GREATEST(
        ROUND(p.price * (1 + p_percent / 100.0), v_digits),
        0
      )::NUMERIC(10, 2) AS target_price
    FROM public.products p
    WHERE p.tenant_id = p_tenant_id
      AND (
        (p_product_ids IS NOT NULL AND p.id = ANY (p_product_ids))
        OR
        (p_product_ids IS NULL
          AND (p_category_id IS NULL OR p.category_id = p_category_id)
          AND (p_exclude_ids IS NULL OR NOT (p.id = ANY (p_exclude_ids))))
      )
  ),
  -- Rounding can land on the price the product already has (a 1% cut on
  -- 10.00 rounded to whole units is still 10.00). Writing those rows would
  -- inflate the "N products updated" count with no-ops and touch updated_at
  -- for nothing, so they are dropped from both preview and write.
  changed AS (
    SELECT * FROM scope WHERE target_price IS DISTINCT FROM current_price
  ),
  updated AS (
    UPDATE public.products p
       SET price = c.target_price,
           updated_by = p_updated_by,
           updated_at = NOW()
      FROM changed c
     WHERE p.id = c.product_id
       -- Repeated even though `changed` is already tenant-scoped: this is the
       -- statement that writes, and it should be readable as safe on its own.
       AND p.tenant_id = p_tenant_id
       AND NOT p_dry_run
    RETURNING p.id
  )
  SELECT c.product_id, c.current_price, c.target_price
    FROM changed c
    -- The UPDATE above runs either way: a data-modifying CTE always executes
    -- exactly once, whether or not the outer query reads it. What gates it is
    -- `NOT p_dry_run` inside the statement, which makes it match no rows in
    -- preview mode. Joining back through `updated` is therefore not what makes
    -- the dry run safe - it is what makes the returned rows *provably* the
    -- rows that were written, so the caller can never report a price it did
    -- not persist.
   WHERE p_dry_run OR EXISTS (SELECT 1 FROM updated u WHERE u.id = c.product_id)
   ORDER BY c.product_id;
END;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================
-- SECURITY DEFINER means the function bypasses RLS, so the tenant_id argument
-- is the ONLY thing standing between one venue and another's prices. Postgres
-- grants EXECUTE to PUBLIC by default, which would let any logged-in user call
-- this over PostgREST with someone else's tenant id. Revoke first, then hand
-- it to service_role only - the API route resolves the tenant from the session
-- and checks for owner/editor before it ever gets here.

REVOKE ALL ON FUNCTION public.bulk_adjust_product_prices(
  BIGINT, NUMERIC, UUID, TEXT, BOOLEAN, BIGINT[], BIGINT, BIGINT[]
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.bulk_adjust_product_prices(
  BIGINT, NUMERIC, UUID, TEXT, BOOLEAN, BIGINT[], BIGINT, BIGINT[]
) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.bulk_adjust_product_prices(
  BIGINT, NUMERIC, UUID, TEXT, BOOLEAN, BIGINT[], BIGINT, BIGINT[]
) TO service_role;

COMMENT ON FUNCTION public.bulk_adjust_product_prices IS
  'Percentage price change across a product set. p_dry_run=TRUE previews without writing. Service role only; caller must authorise the tenant.';
