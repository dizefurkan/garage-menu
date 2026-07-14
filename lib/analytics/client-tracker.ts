/**
 * Analytics Tracking Library
 * ===========================
 * Lightweight, privacy-first analytics client
 * - No external dependencies
 * - ~3KB gzipped
 * - Anonymous session tracking
 * - Zero performance impact
 *
 * Usage:
 * const tracker = new PageTracker({
 *   tenantSlug: 'garage-menu',
 *   apiEndpoint: '/api/analytics/track'
 * });
 * tracker.trackProductClick(123);
 */

interface TrackingConfig {
  tenantSlug: string;
  apiEndpoint: string;
}

interface PageViewPayload {
  eventType: "page_view";
  tenantSlug: string;
  sessionId: string;
  referrer: string;
  deviceType: string;
  osType: string;
  browserName: string;
  browserVersion: string;
  ipCountry?: string;
  language: string;
  timezone: string;
  durationSeconds?: number;
  pageLoadTimeMs?: number;
}

interface ProductInteractionPayload {
  eventType: "product_interaction";
  tenantSlug: string;
  sessionId: string;
  productId: number;
  categoryId?: number;
  interactionType:
    | "view"
    | "scroll_into"
    | "click"
    | "image_click"
    | "section_expand";
  timeOnProductSeconds?: number;
}

interface CategoryInteractionPayload {
  eventType: "category_interaction";
  tenantSlug: string;
  sessionId: string;
  categoryId: number;
  interactionType: "view" | "expand" | "collapse" | "filter";
}

interface PageExitPayload {
  eventType: "page_exit";
  tenantSlug: string;
  sessionId: string;
  durationSeconds: number;
  exitTime: string;
}

type TrackingPayload =
  | PageViewPayload
  | ProductInteractionPayload
  | CategoryInteractionPayload
  | PageExitPayload;

/**
 * Detects device type from user agent
 */
function detectDeviceType(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent.toLowerCase();

  // Mobile patterns
  if (/iphone|ipod|android|windows phone/.test(ua)) {
    return "mobile";
  }

  // Tablet patterns
  if (/ipad|android|tablet|kindle|playbook|silk/.test(ua)) {
    // Exclude phones
    if (/iphone|ipod|windows phone/.test(ua)) {
      return "mobile";
    }
    return "tablet";
  }

  return "desktop";
}

/**
 * Parses user agent to extract OS and browser info
 */
function parseUserAgent(): {
  osType: string;
  browserName: string;
  browserVersion: string;
} {
  const ua = navigator.userAgent;

  let osType = "Unknown";
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  // Detect OS
  if (/Windows/.test(ua)) osType = "Windows";
  else if (/Macintosh/.test(ua)) osType = "macOS";
  else if (/Linux/.test(ua)) osType = "Linux";
  else if (/iPhone|iPad|iPod/.test(ua)) osType = "iOS";
  else if (/Android/.test(ua)) osType = "Android";

  // Detect Browser
  if (/Chrome/.test(ua) && !/Chromium|Edge|Opera|OPR/.test(ua)) {
    browserName = "Chrome";
    browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || "Unknown";
  } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    browserName = "Safari";
    browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || "Unknown";
  } else if (/Firefox/.test(ua)) {
    browserName = "Firefox";
    browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || "Unknown";
  } else if (/Edge|Edg/.test(ua)) {
    browserName = "Edge";
    browserVersion = ua.match(/Edg[e]?\/([\d.]+)/)?.[1] || "Unknown";
  } else if (/OPR|Opera/.test(ua)) {
    browserName = "Opera";
    browserVersion =
      ua.match(/OPR\/([\d.]+)|Version\/([\d.]+)/)?.[1] || "Unknown";
  }

  return { osType, browserName, browserVersion };
}

/**
 * Main Analytics Tracker Class
 */
export class PageTracker {
  private config: TrackingConfig;
  private sessionId: string;
  private startTime: number;
  private pageLoadTime: number = 0;
  private lastActivityTime: number;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private viewedProducts: Set<number> = new Set();
  private expandedCategories: Set<number> = new Set();

  constructor(config: TrackingConfig) {
    console.log('[PageTracker] Constructor called for:', config.tenantSlug);
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.lastActivityTime = Date.now();

    console.log('[PageTracker] Generated sessionId:', this.sessionId.slice(0, 8));

    // Measure page load time
    this.measurePageLoadTime();

    // Initialize tracking
    this.initializeTracking();

    console.log('[PageTracker] Initialization complete');
  }

  /**
   * Generate unique anonymous session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).slice(2, 11);
    return `${timestamp}-${randomPart}`;
  }

  /**
   * Measure page load time (when resources are fully loaded)
   */
  private measurePageLoadTime(): void {
    if (typeof window === "undefined") return;

    if (document.readyState === "complete") {
      this.pageLoadTime = Date.now() - this.startTime;
    } else {
      window.addEventListener("load", () => {
        this.pageLoadTime = Date.now() - this.startTime;
      });
    }
  }

  /**
   * Initialize all tracking listeners
   */
  private initializeTracking(): void {
    if (typeof window === "undefined") return;

    // Track page view
    this.trackPageView();

    // Setup product visibility tracking
    this.setupProductVisibilityTracking();

    // Setup product click tracking
    this.setupProductClickTracking();

    // Setup category expansion tracking
    this.setupCategoryTrackingTracking();

    // Track page exit (before leaving)
    window.addEventListener("beforeunload", () => {
      this.trackPageExit();
    });

    // Track user activity
    this.setupActivityTracking();
  }

  /**
   * Track initial page view
   */
  private trackPageView(): void {
    const payload: PageViewPayload = {
      eventType: "page_view",
      tenantSlug: this.config.tenantSlug,
      sessionId: this.sessionId,
      referrer: document.referrer || "direct",
      deviceType: detectDeviceType(),
      ...parseUserAgent(),
      language: navigator.language || "unknown",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      pageLoadTimeMs: this.pageLoadTime,
    };

    this.sendTrackingEvent(payload);
  }

  /**
   * Setup Intersection Observer for product visibility tracking
   */
  private setupProductVisibilityTracking(): void {
    if (typeof window === "undefined" || !window.IntersectionObserver) return;

    const productElements = document.querySelectorAll("[data-product-id]");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const productId = parseInt(
            entry.target.getAttribute("data-product-id") || "0",
            10
          );
          const categoryId = entry.target.getAttribute("data-category-id")
            ? parseInt(entry.target.getAttribute("data-category-id") || "0", 10)
            : undefined;

          if (productId && !this.viewedProducts.has(productId)) {
            this.viewedProducts.add(productId);
            this.trackProductInteraction(productId, categoryId, "scroll_into");
          }
        }
      });
    });

    productElements.forEach((element) => {
      observer.observe(element);
    });
  }

  /**
   * Setup click tracking for products
   */
  private setupProductClickTracking(): void {
    if (typeof document === "undefined") return;

    document.addEventListener("click", (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const productElement = target.closest("[data-product-id]");

      if (productElement) {
        const productId = parseInt(
          productElement.getAttribute("data-product-id") || "0",
          10
        );
        const categoryId = productElement.getAttribute("data-category-id")
          ? parseInt(productElement.getAttribute("data-category-id") || "0", 10)
          : undefined;

        let interactionType: "click" | "image_click" = "click";

        // Check if click was on product image
        if (
          target.closest("[data-product-image]") ||
          target.tagName === "IMG"
        ) {
          interactionType = "image_click";
        }

        this.trackProductInteraction(productId, categoryId, interactionType);
      }
    });
  }

  /**
   * Setup category expand/collapse tracking
   */
  private setupCategoryTrackingTracking(): void {
    if (typeof document === "undefined") return;

    document.addEventListener("click", (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const categoryToggle = target.closest(
        "[data-category-id][data-category-toggle]"
      );

      if (categoryToggle) {
        const categoryId = parseInt(
          categoryToggle.getAttribute("data-category-id") || "0",
          10
        );
        const isExpanded =
          categoryToggle.getAttribute("data-expanded") === "true";

        this.trackCategoryInteraction(
          categoryId,
          isExpanded ? "expand" : "collapse"
        );
      }
    });
  }

  /**
   * Setup general activity tracking (to detect page exit intent)
   */
  private setupActivityTracking(): void {
    if (typeof document === "undefined") return;

    const updateActivity = () => {
      this.lastActivityTime = Date.now();
    };

    document.addEventListener("mousemove", updateActivity);
    document.addEventListener("keypress", updateActivity);
    document.addEventListener("scroll", updateActivity);
  }

  /**
   * Track product interaction
   */
  public trackProductInteraction(
    productId: number,
    categoryId: number | undefined,
    interactionType:
      | "view"
      | "scroll_into"
      | "click"
      | "image_click"
      | "section_expand"
  ): void {
    const payload: ProductInteractionPayload = {
      eventType: "product_interaction",
      tenantSlug: this.config.tenantSlug,
      sessionId: this.sessionId,
      productId,
      categoryId,
      interactionType,
      timeOnProductSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };

    this.sendTrackingEvent(payload);
  }

  /**
   * Track category interaction
   */
  public trackCategoryInteraction(
    categoryId: number,
    interactionType: "view" | "expand" | "collapse" | "filter"
  ): void {
    const payload: CategoryInteractionPayload = {
      eventType: "category_interaction",
      tenantSlug: this.config.tenantSlug,
      sessionId: this.sessionId,
      categoryId,
      interactionType,
    };

    this.sendTrackingEvent(payload);
  }

  /**
   * Track when user exits/leaves the page
   */
  public trackPageExit(): void {
    const durationSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    // Send exit event to server
    const payload: PageExitPayload = {
      eventType: "page_exit",
      tenantSlug: this.config.tenantSlug,
      sessionId: this.sessionId,
      durationSeconds,
      exitTime: new Date().toISOString(),
    };

    // Use beacon API for better reliability when page is unloading
    this.sendBeacon(payload);
  }

  /**
   * Send tracking event to server
   */
  private sendTrackingEvent(payload: TrackingPayload): void {
    console.log('[PageTracker] Sending tracking event:', payload.eventType);

    // Use sendBeacon if available (more reliable) for non-critical events
    // Otherwise use fetch
    if (typeof navigator.sendBeacon === 'function') {
      console.log('[PageTracker] Using sendBeacon API');
      this.sendBeacon(payload);
    } else {
      console.log('[PageTracker] Using fetch API');
      fetch(this.config.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        // Use 'keepalive' to ensure request completes even if page unloads
        keepalive: true,
      })
        .then((response) => {
          console.log('[PageTracker] Event sent, response status:', response.status);
        })
        .catch((error) => {
          // Log error - it might impact user experience
          console.error("[PageTracker] Tracking event failed:", error);
        });
    }
  }

  /**
   * Send event using Beacon API (more reliable for exit events)
   */
  private sendBeacon(payload: TrackingPayload): void {
    if (!navigator.sendBeacon) {
      this.sendTrackingEvent(payload);
      return;
    }

    try {
      navigator.sendBeacon(this.config.apiEndpoint, JSON.stringify(payload));
    } catch (error) {
      // Fallback to fetch
      this.sendTrackingEvent(payload);
    }
  }
}

/**
 * Initialize tracker on page load
 */
export function initializeAnalytics(config: TrackingConfig): PageTracker {
  if (typeof window === "undefined") {
    throw new Error("Analytics can only be initialized in browser context");
  }

  console.log('[PageTracker] Creating new PageTracker instance for:', config.tenantSlug);
  return new PageTracker(config);
}
