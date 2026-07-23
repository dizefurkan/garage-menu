-- ============================================================================
-- PUBLIC READ ACCESS FOR PRODUCT ALLERGENS
-- ============================================================================
-- product_allergens rows power allergen chips on the public QR menu, so they
-- are public data by design (allergens/allergen_translations already have
-- public SELECT from migration 003). Without this, a client using the anon
-- key sees products but silently-empty product_allergens in nested selects.
--
-- Note: this complements - does NOT replace - setting the real service_role
-- key in the deployment environment; admin writes to product_allergens and
-- signed storage uploads still require the service role.
--
-- Paste into the Supabase SQL Editor and run. Idempotent - safe to re-run.
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can read product allergens" ON public.product_allergens;
CREATE POLICY "Anyone can read product allergens"
  ON public.product_allergens FOR SELECT
  USING (true);

INSERT INTO public.migration_log (migration_name, version)
VALUES ('006_public_read_product_allergens', 1)
ON CONFLICT (migration_name) DO UPDATE
SET applied_at = NOW(), version = migration_log.version + 1;
