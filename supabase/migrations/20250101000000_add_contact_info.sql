-- Migration: Add contact_info field to tenants table
-- This adds address and social media contact information storage

-- Add contact_info column to tenants table 
ALTER TABLE public.tenants 
ADD COLUMN contact_info JSONB DEFAULT '{"address": "", "facebook": "", "instagram": "", "tiktok": "", "email": "", "whatsapp": ""}';

-- You can run this migration by:
-- 1. Go to Supabase Dashboard -> SQL Editor
-- 2. Click "New Query"
-- 3. Copy and paste this SQL
-- 4. Click "Run"

-- Example of what contact_info looks like:
-- {
--   "address": "123 Main Street, City, Country",
--   "facebook": "https://facebook.com/yourpage",
--   "instagram": "@yourusername",
--   "tiktok": "@yourusername",
--   "email": "contact@restaurant.com",
--   "whatsapp": "+90 555 123 4567"
-- }
