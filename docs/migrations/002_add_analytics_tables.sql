-- ============================================================================
-- ANALYTICS FEATURE - DATABASE SCHEMA MIGRATION
-- ============================================================================
-- Adds page view tracking, product interactions, and analytics tables
-- Supports multi-tenant, privacy-first analytics with RLS
-- ============================================================================

-- ============================================================================
-- 1. CREATE ANALYTICS TABLES
-- ============================================================================

-- Page Views Table - Tracks every visitor session
CREATE TABLE IF NOT EXISTS public.page_views (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,                              -- Anonymous session ID
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Referrer and source
  referrer VARCHAR(500),                                 -- HTTP referrer
  utm_source VARCHAR(100),                               -- UTM source parameter
  utm_medium VARCHAR(100),                               -- UTM medium parameter
  utm_campaign VARCHAR(100),                             -- UTM campaign parameter
  
  -- Device information
  device_type VARCHAR(50),                               -- mobile|tablet|desktop
  os_type VARCHAR(50),                                   -- iOS|Android|Windows|macOS|Linux
  browser_name VARCHAR(100),                             -- Chrome|Firefox|Safari|Edge
  browser_version VARCHAR(20),                           -- Browser version
  user_agent TEXT,                                       -- Raw user agent string
  
  -- Geographic data (anonymized - country only)
  ip_country VARCHAR(2),                                 -- ISO country code
  ip_country_name VARCHAR(100),                          -- Country name
  
  -- User preferences
  language VARCHAR(5),                                   -- Browser language
  timezone VARCHAR(50),                                  -- User timezone
  
  -- Engagement metrics
  duration_seconds INT DEFAULT 0,                        -- Total time on page
  exit_page VARCHAR(255),                                -- Last section viewed
  
  -- Performance metrics
  page_load_time_ms INT,                                 -- Page load time in milliseconds
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT page_views_duration_check CHECK (duration_seconds >= 0),
  CONSTRAINT page_views_load_time_check CHECK (page_load_time_ms IS NULL OR page_load_time_ms >= 0)
);

-- Indexes for common queries
CREATE INDEX idx_page_views_tenant_date ON public.page_views(tenant_id, visited_at DESC);
CREATE INDEX idx_page_views_session ON public.page_views(session_id);
CREATE INDEX idx_page_views_tenant_device ON public.page_views(tenant_id, device_type);
CREATE INDEX idx_page_views_tenant_country ON public.page_views(tenant_id, ip_country);
CREATE INDEX idx_page_views_visited_at ON public.page_views(visited_at DESC);

-- Product Interactions Table - Tracks product clicks, views, etc.
CREATE TABLE IF NOT EXISTS public.product_interactions (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- Interaction type
  interaction_type VARCHAR(50) NOT NULL,                 -- view|scroll_into|click|image_click|section_expand
  
  -- Timing
  interacted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_on_product_seconds INT DEFAULT 0,                 -- How long user viewed this product
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT product_interactions_time_check CHECK (time_on_product_seconds >= 0),
  CONSTRAINT product_interactions_type_check CHECK (interaction_type IN (
    'view', 'scroll_into', 'click', 'image_click', 'section_expand'
  ))
);

-- Indexes for product interactions
CREATE INDEX idx_product_interactions_tenant_product ON public.product_interactions(tenant_id, product_id);
CREATE INDEX idx_product_interactions_tenant_date ON public.product_interactions(tenant_id, interacted_at DESC);
CREATE INDEX idx_product_interactions_session ON public.product_interactions(session_id);
CREATE INDEX idx_product_interactions_category ON public.product_interactions(tenant_id, category_id);
CREATE INDEX idx_product_interactions_type ON public.product_interactions(tenant_id, interaction_type);

-- Category Interactions Table - Tracks category expand/collapse, etc.
CREATE TABLE IF NOT EXISTS public.category_interactions (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  
  -- Interaction type
  interaction_type VARCHAR(50) NOT NULL,                 -- view|expand|collapse|filter
  
  -- Timing
  interacted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT category_interactions_type_check CHECK (interaction_type IN (
    'view', 'expand', 'collapse', 'filter'
  ))
);

-- Indexes for category interactions
CREATE INDEX idx_category_interactions_tenant_category ON public.category_interactions(tenant_id, category_id);
CREATE INDEX idx_category_interactions_tenant_date ON public.category_interactions(tenant_id, interacted_at DESC);
CREATE INDEX idx_category_interactions_session ON public.category_interactions(session_id);

-- ============================================================================
-- 2. CREATE MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Daily Summary View - Aggregated daily metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.analytics_daily_summary AS
SELECT 
  pv.tenant_id,
  DATE(pv.visited_at) as view_date,
  COUNT(*) as total_views,
  COUNT(DISTINCT pv.session_id) as unique_sessions,
  ROUND(AVG(pv.duration_seconds)::numeric, 2) as avg_duration_seconds,
  MIN(pv.duration_seconds) as min_duration_seconds,
  MAX(pv.duration_seconds) as max_duration_seconds,
  COUNT(CASE WHEN pv.duration_seconds = 0 THEN 1 END) as bounce_count,
  ROUND(100.0 * COUNT(CASE WHEN pv.duration_seconds = 0 THEN 1 END) / NULLIF(COUNT(*), 0), 2) as bounce_rate_percent,
  ROUND(AVG(pv.page_load_time_ms)::numeric, 0) as avg_page_load_ms
FROM public.page_views pv
GROUP BY pv.tenant_id, DATE(pv.visited_at);

CREATE INDEX idx_analytics_daily_summary_tenant_date ON public.analytics_daily_summary(tenant_id, view_date DESC);

-- Product Heatmap View - Ranked products by interaction intensity
CREATE MATERIALIZED VIEW IF NOT EXISTS public.analytics_product_heatmap AS
SELECT 
  tenant_id,
  product_id,
  COUNT(*) as total_interactions,
  COUNT(CASE WHEN interaction_type='click' THEN 1 END) as click_count,
  COUNT(CASE WHEN interaction_type='view' THEN 1 END) as view_count,
  COUNT(CASE WHEN interaction_type='scroll_into' THEN 1 END) as scroll_count,
  COUNT(CASE WHEN interaction_type='image_click' THEN 1 END) as image_click_count,
  ROUND(AVG(time_on_product_seconds)::numeric, 2) as avg_time_on_product_seconds,
  COUNT(DISTINCT session_id) as unique_viewers,
  ROUND(100.0 * COUNT(CASE WHEN interaction_type='click' THEN 1 END) / NULLIF(COUNT(*), 0), 2) as click_through_rate_percent,
  MAX(interacted_at) as last_interaction_at
FROM public.product_interactions
WHERE interacted_at > NOW() - INTERVAL '90 days'
GROUP BY tenant_id, product_id;

CREATE INDEX idx_analytics_product_heatmap_tenant ON public.analytics_product_heatmap(tenant_id, total_interactions DESC);
CREATE INDEX idx_analytics_product_heatmap_product ON public.analytics_product_heatmap(tenant_id, product_id);

-- Category Heatmap View - Category popularity metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.analytics_category_heatmap AS
SELECT 
  tenant_id,
  category_id,
  COUNT(*) as total_interactions,
  COUNT(CASE WHEN interaction_type='expand' THEN 1 END) as expand_count,
  COUNT(CASE WHEN interaction_type='collapse' THEN 1 END) as collapse_count,
  COUNT(CASE WHEN interaction_type='view' THEN 1 END) as view_count,
  COUNT(DISTINCT session_id) as unique_viewers,
  ROUND(100.0 * COUNT(CASE WHEN interaction_type='expand' THEN 1 END) / NULLIF(COUNT(*), 0), 2) as expansion_rate_percent,
  MAX(interacted_at) as last_interaction_at
FROM public.category_interactions
WHERE interacted_at > NOW() - INTERVAL '90 days'
GROUP BY tenant_id, category_id;

CREATE INDEX idx_analytics_category_heatmap_tenant ON public.analytics_category_heatmap(tenant_id, total_interactions DESC);

-- Device Analytics View - Device breakdown
CREATE MATERIALIZED VIEW IF NOT EXISTS public.analytics_device_breakdown AS
SELECT 
  tenant_id,
  device_type,
  os_type,
  browser_name,
  COUNT(*) as view_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  ROUND(AVG(duration_seconds)::numeric, 2) as avg_duration_seconds,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY tenant_id), 2) as percentage_of_total
FROM public.page_views
WHERE visited_at > NOW() - INTERVAL '30 days'
GROUP BY tenant_id, device_type, os_type, browser_name;

CREATE INDEX idx_analytics_device_breakdown_tenant ON public.analytics_device_breakdown(tenant_id, view_count DESC);

-- Geographic Analytics View - Traffic by country
CREATE MATERIALIZED VIEW IF NOT EXISTS public.analytics_geographic_breakdown AS
SELECT 
  tenant_id,
  ip_country,
  ip_country_name,
  COUNT(*) as view_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  ROUND(AVG(duration_seconds)::numeric, 2) as avg_duration_seconds,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY tenant_id), 2) as percentage_of_total
FROM public.page_views
WHERE visited_at > NOW() - INTERVAL '30 days' AND ip_country IS NOT NULL
GROUP BY tenant_id, ip_country, ip_country_name;

CREATE INDEX idx_analytics_geographic_breakdown_tenant ON public.analytics_geographic_breakdown(tenant_id, view_count DESC);

-- Referrer Analytics View - Top traffic sources
CREATE MATERIALIZED VIEW IF NOT EXISTS public.analytics_referrer_breakdown AS
SELECT 
  tenant_id,
  COALESCE(referrer, 'direct') as referrer_source,
  COUNT(*) as view_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  ROUND(AVG(duration_seconds)::numeric, 2) as avg_duration_seconds,
  ROUND(100.0 * COUNT(CASE WHEN duration_seconds = 0 THEN 1 END) / NULLIF(COUNT(*), 0), 2) as bounce_rate_percent
FROM public.page_views
WHERE visited_at > NOW() - INTERVAL '30 days'
GROUP BY tenant_id, COALESCE(referrer, 'direct');

CREATE INDEX idx_analytics_referrer_breakdown_tenant ON public.analytics_referrer_breakdown(tenant_id, view_count DESC);

-- ============================================================================
-- 3. CREATE FUNCTIONS FOR DATA MAINTENANCE
-- ============================================================================

-- Function to delete old analytics data (retention: 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS TABLE(deleted_page_views BIGINT, deleted_product_interactions BIGINT, deleted_category_interactions BIGINT) AS $$
DECLARE
  v_deleted_pv BIGINT;
  v_deleted_pi BIGINT;
  v_deleted_ci BIGINT;
BEGIN
  -- Delete old page views
  DELETE FROM public.page_views
  WHERE visited_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_deleted_pv = ROW_COUNT;
  
  -- Delete old product interactions
  DELETE FROM public.product_interactions
  WHERE interacted_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_deleted_pi = ROW_COUNT;
  
  -- Delete old category interactions
  DELETE FROM public.category_interactions
  WHERE interacted_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_deleted_ci = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted_pv, v_deleted_pi, v_deleted_ci;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
RETURNS void AS $$
BEGIN
  -- Refresh views without CONCURRENTLY to avoid locking issues
  -- Note: This will lock reads temporarily but will succeed
  REFRESH MATERIALIZED VIEW public.analytics_daily_summary;
  REFRESH MATERIALIZED VIEW public.analytics_product_heatmap;
  REFRESH MATERIALIZED VIEW public.analytics_category_heatmap;
  REFRESH MATERIALIZED VIEW public.analytics_device_breakdown;
  REFRESH MATERIALIZED VIEW public.analytics_geographic_breakdown;
  REFRESH MATERIALIZED VIEW public.analytics_referrer_breakdown;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all analytics tables
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Only owners/editors of tenant can view their analytics
CREATE POLICY tenant_select_page_views ON public.page_views
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
  )
);

CREATE POLICY tenant_select_product_interactions ON public.product_interactions
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
  )
);

CREATE POLICY tenant_select_category_interactions ON public.category_interactions
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.tenant_users 
    WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
  )
);

-- Public (anonymous) can INSERT tracking data
CREATE POLICY anon_insert_page_views ON public.page_views
FOR INSERT
WITH CHECK (true);

CREATE POLICY anon_insert_product_interactions ON public.product_interactions
FOR INSERT
WITH CHECK (true);

CREATE POLICY anon_insert_category_interactions ON public.category_interactions
FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- 5. ADD UPDATED_AT TRIGGER TO MAIN TABLES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_page_views_updated_at
BEFORE UPDATE ON public.page_views
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 6. MIGRATION STATUS
-- ============================================================================

-- Insert a migration log entry (optional, for tracking)
-- You can query this to verify migration was applied
CREATE TABLE IF NOT EXISTS public.migration_log (
  id BIGSERIAL PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INT DEFAULT 1
);

INSERT INTO public.migration_log (migration_name, version)
VALUES ('002_add_analytics_tables', 1)
ON CONFLICT (migration_name) DO UPDATE
SET applied_at = NOW(), version = migration_log.version + 1;

-- ============================================================================
-- 7. FINAL NOTES
-- ============================================================================

-- Materialized views should be refreshed periodically:
-- - Set up a pg_cron job OR
-- - Call refresh_analytics_views() from your application scheduler
--
-- Example cron job (if pg_cron extension is available):
-- SELECT cron.schedule('refresh-analytics-views', '0 * * * *', 'SELECT public.refresh_analytics_views()');
--
-- Data cleanup (delete >90 days old):
-- - Set up a pg_cron job OR  
-- - Call cleanup_old_analytics() from your application scheduler daily
--
-- Example cron job:
-- SELECT cron.schedule('cleanup-old-analytics', '0 2 * * *', 'SELECT public.cleanup_old_analytics()');

