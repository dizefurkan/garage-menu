"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import type { Database } from "@/lib/database.types";

type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

type MenuLayout = Tenant["menu_layout"];
type CategorySort = Tenant["category_sort"];
type ProductSort = Tenant["product_sort"];

interface ThemeSettingsProps {
  tenant: Tenant;
  messages?: Record<string, string>;
  /** Whether any category has a banner image — drives the fallback warning. */
  hasCategoryImages?: boolean;
}

export function ThemeSettings({
  tenant,
  messages = {},
  hasCategoryImages = true,
}: ThemeSettingsProps) {
  const t = (key: string, defaultValue: string = "") => {
    return (messages[key] as string) || defaultValue;
  };

  const themeConfig = (tenant.theme_config as {
    primary: string;
    secondary: string;
    accent?: string;
    font?: string;
  }) || {
    primary: "#000000",
    secondary: "#FFFFFF",
  };

  const [primary, setPrimary] = useState(themeConfig.primary);
  const [secondary, setSecondary] = useState(themeConfig.secondary);
  const [accent, setAccent] = useState(themeConfig.accent || "#808080");
  // Stored in its own column rather than inside theme_config: that JSONB is
  // validated as hex colours + font, and a structural layout flag does not
  // belong there. It is still a theme choice from the user's point of view.
  const [menuLayout, setMenuLayout] = useState<MenuLayout>(
    tenant.menu_layout ?? "products"
  );
  const [categorySort, setCategorySort] = useState<CategorySort>(
    tenant.category_sort ?? "manual"
  );
  const [productSort, setProductSort] = useState<ProductSort>(
    tenant.product_sort ?? "manual"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/settings/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          theme_config: {
            primary,
            secondary,
            accent: accent || undefined,
          },
          menu_layout: menuLayout,
          category_sort: categorySort,
          product_sort: productSort,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || t("failedToUpdate", "Failed to update theme")
        );
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="mb-3 block text-sm font-medium">
            {t("primaryColor", "Primary Color")}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="h-12 w-20 cursor-pointer rounded border border-gray-200"
            />
            <input
              type="text"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              placeholder="#000000"
              className="flex h-10 w-32 rounded border border-input bg-background px-3 py-2 text-sm"
            />
            <span className="text-xs text-gray-500">
              Used for buttons and accents
            </span>
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">
            {t("secondaryColor", "Secondary Color")}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              className="h-12 w-20 cursor-pointer rounded border border-gray-200"
            />
            <input
              type="text"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              placeholder="#FFFFFF"
              className="flex h-10 w-32 rounded border border-input bg-background px-3 py-2 text-sm"
            />
            <span className="text-xs text-gray-500">Used for backgrounds</span>
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">
            {t("accentColor", "Accent Color")} (Optional)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-12 w-20 cursor-pointer rounded border border-gray-200"
            />
            <input
              type="text"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              placeholder="#808080"
              className="flex h-10 w-32 rounded border border-input bg-background px-3 py-2 text-sm"
            />
            <span className="text-xs text-gray-500">Used for highlights</span>
          </div>
        </div>
      </div>

      {/* Menu layout — a layout choice deserves to be *seen*, not picked from
          a dropdown, so each option carries a small wireframe of the result. */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium">
            {t("menuLayoutTitle", "Menu Layout")}
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("menuLayoutHint", "")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                value: "products" as const,
                label: t("menuLayoutProducts", "Product list"),
                hint: t("menuLayoutProductsHint", ""),
              },
              {
                value: "categories" as const,
                label: t("menuLayoutCategories", "Category cards"),
                hint: t("menuLayoutCategoriesHint", ""),
              },
            ]
          ).map((option) => {
            const selected = menuLayout === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setMenuLayout(option.value)}
                aria-pressed={selected}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selected
                    ? "border-foreground bg-accent"
                    : "border-border hover:bg-accent/50"
                }`}
              >
                <div
                  className="mb-3 space-y-1.5 rounded border border-border bg-background p-2"
                  aria-hidden
                >
                  {option.value === "products" ? (
                    <>
                      <div className="h-1.5 w-10 rounded-full bg-foreground/50" />
                      <div className="flex gap-1.5">
                        <div className="h-6 flex-1 rounded bg-foreground/10" />
                        <div className="h-6 flex-1 rounded bg-foreground/10" />
                      </div>
                      <div className="h-1.5 w-8 rounded-full bg-foreground/50" />
                      <div className="flex gap-1.5">
                        <div className="h-6 flex-1 rounded bg-foreground/10" />
                        <div className="h-6 flex-1 rounded bg-foreground/10" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-5 w-full rounded bg-foreground/20" />
                      <div className="h-5 w-full rounded bg-foreground/15" />
                      <div className="h-5 w-full rounded bg-foreground/10" />
                    </>
                  )}
                </div>

                <p className="text-sm font-medium">{option.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {option.hint}
                </p>
              </button>
            );
          })}
        </div>

        {menuLayout === "categories" && !hasCategoryImages && (
          <p className="rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground">
            {t("menuLayoutNoImagesWarning", "")}
          </p>
        )}
      </div>

      {/* Ordering. Lives next to the layout because both answer the same
          question — how the public menu presents itself. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="category-sort"
            className="mb-2 block text-sm font-medium"
          >
            {t("categorySortTitle", "Category order")}
          </label>
          <select
            id="category-sort"
            value={categorySort}
            onChange={(e) => setCategorySort(e.target.value as CategorySort)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="manual">{t("sortManual", "Manual order")}</option>
            <option value="alphabetical">
              {t("sortAlphabetical", "Alphabetical (A-Z)")}
            </option>
            <option value="popularity">
              {t("sortPopularity", "Most ordered")}
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="product-sort"
            className="mb-2 block text-sm font-medium"
          >
            {t("productSortTitle", "Product order")}
          </label>
          <select
            id="product-sort"
            value={productSort}
            onChange={(e) => setProductSort(e.target.value as ProductSort)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="manual">{t("sortManual", "Manual order")}</option>
            <option value="alphabetical">
              {t("sortAlphabetical", "Alphabetical (A-Z)")}
            </option>
            <option value="popularity">
              {t("sortPopularity", "Most ordered")}
            </option>
            <option value="price_asc">
              {t("sortPriceAsc", "Price: low to high")}
            </option>
            <option value="price_desc">
              {t("sortPriceDesc", "Price: high to low")}
            </option>
            <option value="newest">{t("sortNewest", "Newest first")}</option>
          </select>
        </div>

        {(categorySort === "popularity" || productSort === "popularity") && (
          <p className="text-xs text-muted-foreground sm:col-span-2">
            {t("sortPopularityNeedsOrders", "")}
          </p>
        )}
      </div>

      {/* Theme Preview */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <CardDescription className="mb-4 text-xs font-semibold text-gray-600">
            PREVIEW
          </CardDescription>
          <div className="flex gap-4">
            <div className="space-y-2">
              <div
                className="h-24 w-24 rounded border-2 border-gray-200"
                style={{ backgroundColor: primary }}
              />
              <p className="text-xs text-gray-600">Primary</p>
            </div>
            <div className="space-y-2">
              <div
                className="h-24 w-24 rounded border-2 border-gray-200"
                style={{ backgroundColor: secondary }}
              />
              <p className="text-xs text-gray-600">Secondary</p>
            </div>
            <div className="space-y-2">
              <div
                className="h-24 w-24 rounded border-2 border-gray-200"
                style={{ backgroundColor: accent }}
              />
              <p className="text-xs text-gray-600">Accent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {t("themeSaved", "Theme settings updated successfully")}
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : t("saveChanges", "Save Theme")}
      </Button>
    </form>
  );
}
