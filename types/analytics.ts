/**
 * Analytics Type Definitions
 */

export interface TrackingConfig {
  tenantSlug: string;
  apiEndpoint: string;
}

// Page View
export interface PageViewEvent {
  eventType: 'page_view';
  tenantSlug: string;
  sessionId: string;
  referrer: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  osType: string;
  browserName: string;
  browserVersion: string;
  language: string;
  timezone: string;
  pageLoadTimeMs?: number;
}

// Product Interaction
export interface ProductInteractionEvent {
  eventType: 'product_interaction';
  tenantSlug: string;
  sessionId: string;
  productId: number;
  categoryId?: number;
  interactionType: 'view' | 'scroll_into' | 'click' | 'image_click' | 'section_expand';
  timeOnProductSeconds?: number;
}

// Category Interaction
export interface CategoryInteractionEvent {
  eventType: 'category_interaction';
  tenantSlug: string;
  sessionId: string;
  categoryId: number;
  interactionType: 'view' | 'expand' | 'collapse' | 'filter';
}

// Analytics Data
export interface AnalyticsSummary {
  totalViews: number;
  uniqueSessions: number;
  avgDuration: number;
  bounceRate: number;
  avgPageLoad: number;
  dailyData: DailySummary[];
}

export interface DailySummary {
  viewDate: string;
  totalViews: number;
  uniqueSessions: number;
  avgDurationSeconds: number;
  minDurationSeconds: number;
  maxDurationSeconds: number;
  bounceCount: number;
  bounceRatePercent: number;
  avgPageLoadMs: number;
}

export interface ProductHeatmapData {
  productId: number;
  productName: string;
  totalInteractions: number;
  clicks: number;
  views: number;
  scrolls: number;
  imageClicks: number;
  avgTimeSeconds: number;
  uniqueViewers: number;
  clickThroughRate: number;
  price?: number;
}

export interface CategoryHeatmapData {
  categoryId: number;
  categoryName: string;
  totalInteractions: number;
  expansions: number;
  collapses: number;
  views: number;
  uniqueViewers: number;
  expansionRate: number;
}

export interface DeviceAnalytics {
  deviceType: string;
  osType: string;
  browserName: string;
  viewCount: number;
  uniqueSessions: number;
  avgDurationSeconds: number;
  percentageOfTotal: number;
}

export interface GeographicAnalytics {
  ipCountry: string;
  ipCountryName: string;
  viewCount: number;
  uniqueSessions: number;
  avgDurationSeconds: number;
  percentageOfTotal: number;
}

export interface ReferrerAnalytics {
  referrerSource: string;
  viewCount: number;
  uniqueSessions: number;
  avgDurationSeconds: number;
  bounceRatePercent: number;
}

export interface TimeSeriesPoint {
  date: string;
  views: number;
  sessions: number;
  avgDuration: number;
  bounceRate: number;
}
