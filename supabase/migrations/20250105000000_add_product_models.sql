-- ============================================================================
-- 3D/AR PRODUCT MODELS - DATABASE SCHEMA MIGRATION
-- ============================================================================
-- Adds GLB/USDZ 3D model URL columns to products and storage RLS policies
-- for the new "product-models" bucket. Models are produced externally
-- (Polycam, Luma AI, KIRI Engine) and uploaded by restaurant owners;
-- customers view them inline in 3D and in AR (Android Scene Viewer via GLB,
-- iOS AR Quick Look via USDZ).
--
-- MANUAL PREREQUISITE (Supabase console -> Storage, do this FIRST):
--   Create bucket "product-models"
--     - Public: ON
--     - File size limit: 26214400 (25MB)
--     - Allowed MIME types: model/gltf-binary, model/vnd.usdz+zip,
--       application/octet-stream
--
-- Then paste this whole file into the SQL Editor and run.
-- Idempotent - safe to re-run.
-- ============================================================================

-- ============================================================================
-- 1. PRODUCT COLUMNS
-- ============================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS model_glb_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS model_usdz_url TEXT;

-- ============================================================================
-- 2. STORAGE RLS FOR product-models
--    (mirrors the product-images policy set; tenant-folder scoped writes)
-- ============================================================================

DROP POLICY IF EXISTS "models_service_role_insert" ON storage.objects;
CREATE POLICY "models_service_role_insert" ON storage.objects FOR INSERT
  WITH CHECK (auth.role() = 'service_role' AND bucket_id = 'product-models');

DROP POLICY IF EXISTS "models_service_role_delete" ON storage.objects;
CREATE POLICY "models_service_role_delete" ON storage.objects FOR DELETE
  USING (auth.role() = 'service_role' AND bucket_id = 'product-models');

DROP POLICY IF EXISTS "models_public_read" ON storage.objects;
CREATE POLICY "models_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-models');

DROP POLICY IF EXISTS "models_authenticated_insert" ON storage.objects;
CREATE POLICY "models_authenticated_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-models'
    AND (storage.foldername(name))[1] = (public.user_tenant_id())::TEXT
  );

DROP POLICY IF EXISTS "models_authenticated_delete" ON storage.objects;
CREATE POLICY "models_authenticated_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-models'
    AND (storage.foldername(name))[1] = (public.user_tenant_id())::TEXT
  );

-- ============================================================================
-- 3. MIGRATION LOG
-- ============================================================================

INSERT INTO public.migration_log (migration_name, version)
VALUES ('005_add_product_models', 1)
ON CONFLICT (migration_name) DO UPDATE
SET applied_at = NOW(), version = migration_log.version + 1;
