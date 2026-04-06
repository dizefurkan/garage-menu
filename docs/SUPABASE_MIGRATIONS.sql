-- ============================================================================
-- SUPABASE MIGRATION SCRIPTS
-- ============================================================================
-- Copy and paste these SQL commands into Supabase SQL Editor
-- Go to: Supabase Dashboard → Your Project → SQL Editor → New Query
-- ============================================================================

-- ============================================================================
-- 1. ADD CONTACT INFORMATION COLUMN (Required for contact info feature)
-- ============================================================================
ALTER TABLE public.tenants 
ADD COLUMN contact_info JSONB DEFAULT '{"address": "", "facebook": "", "instagram": "", "tiktok": "", "email": "", "whatsapp": ""}';

-- ============================================================================
-- VERIFICATION QUERY (Run this after to confirm)
-- ============================================================================
-- SELECT * FROM public.tenants LIMIT 1;
-- If you see contact_info column, migration was successful!
