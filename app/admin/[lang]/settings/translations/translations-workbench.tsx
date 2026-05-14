"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

type TranslationRecord = {
  language_code: string;
  name?: string | null;
  description?: string | null;
};

type CategoryItem = {
  id: number;
  display_order?: number | null;
  created_at?: string;
  category_translations?: TranslationRecord[];
};

type ProductItem = {
  id: number;
  category_id: number;
  price?: number | null;
  currency?: string | null;
  image_url?: string | null;
  is_available?: boolean;
  is_draft?: boolean;
  created_at?: string;
  display_order?: number | null;
  product_translations?: TranslationRecord[];
};

type TranslationDraft = {
  name: string;
  description: string;
};

type ItemType = "product" | "category";

type DraftMeta = {
  type: ItemType;
  id: number;
  targetLanguage: string;
};

type Props = {
  categories: CategoryItem[];
  initialEntityId: number | null;
  initialEntityType: ItemType;
  products: ProductItem[];
  sourceLanguage: string;
  targetLanguage: string;
  targetLanguageLabels: Record<string, string>;
  targetLanguageOptions: string[];
};

function getLanguageLabel(
  languageCode: string,
  labels: Record<string, string>
) {
  return labels[languageCode] || languageCode.toUpperCase();
}

function getTranslationValue(
  translations: TranslationRecord[] | undefined,
  languageCode: string,
  field: keyof TranslationDraft
) {
  return (
    translations?.find(
      (translation) => translation.language_code === languageCode
    )?.[field] || ""
  );
}

function getRequiredFieldCount(source: TranslationDraft) {
  return [source.name, source.description].filter((value) => value.trim())
    .length;
}

function getCompletedFieldCount(
  source: TranslationDraft,
  target: TranslationDraft
) {
  return [source.name, source.description].reduce((count, value, index) => {
    if (!value.trim()) {
      return count;
    }

    const targetValue = index === 0 ? target.name : target.description;
    return count + (targetValue.trim() ? 1 : 0);
  }, 0);
}

function getCompletionPercent(
  source: TranslationDraft,
  target: TranslationDraft
) {
  const required = getRequiredFieldCount(source);
  if (required === 0) return 100;

  return Math.round((getCompletedFieldCount(source, target) / required) * 100);
}

export function TranslationsWorkbench({
  categories,
  initialEntityId,
  initialEntityType,
  products,
  sourceLanguage,
  targetLanguage,
  targetLanguageLabels,
  targetLanguageOptions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeType, setActiveType] = useState<ItemType>(initialEntityType);
  const [activeId, setActiveId] = useState<number | null>(initialEntityId);
  const [activeTargetLanguage, setActiveTargetLanguage] =
    useState(targetLanguage);
  const [drafts, setDrafts] = useState<Record<string, TranslationDraft>>({});
  const [originals, setOriginals] = useState<Record<string, TranslationDraft>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const hasTargetLanguages = targetLanguageOptions.length > 0;

  const getDraftKey = useCallback(
    (type: ItemType, id: number | null, targetLanguage: string) =>
      `${type}:${id ?? "none"}:${targetLanguage}`,
    []
  );

  const parseDraftKey = (draftKey: string): DraftMeta | null => {
    const [type, idText, targetLanguage] = draftKey.split(":");
    if ((type !== "product" && type !== "category") || !targetLanguage) {
      return null;
    }

    const id = Number(idText);
    if (!Number.isFinite(id)) {
      return null;
    }

    return {
      type,
      id,
      targetLanguage,
    };
  };

  const categoryItems = useMemo(
    () =>
      [...categories].sort(
        (left, right) =>
          (left.display_order || left.id) - (right.display_order || right.id)
      ),
    [categories]
  );

  const productItems = useMemo(
    () =>
      [...products].sort(
        (left, right) =>
          (left.display_order || left.id) - (right.display_order || right.id)
      ),
    [products]
  );

  // Initialize originals from products and categories
  useEffect(() => {
    const newOriginals: Record<string, TranslationDraft> = {};

    productItems.forEach((item) => {
      targetLanguageOptions.forEach((lang) => {
        const key = `product:${item.id}:${lang}`;
        newOriginals[key] = {
          name: getTranslationValue(item.product_translations, lang, "name"),
          description: getTranslationValue(
            item.product_translations,
            lang,
            "description"
          ),
        };
      });
    });

    categoryItems.forEach((item) => {
      targetLanguageOptions.forEach((lang) => {
        const key = `category:${item.id}:${lang}`;
        newOriginals[key] = {
          name: getTranslationValue(item.category_translations, lang, "name"),
          description: getTranslationValue(
            item.category_translations,
            lang,
            "description"
          ),
        };
      });
    });

    setOriginals(newOriginals);
  }, [productItems, categoryItems, targetLanguageOptions]);

  const activeList = activeType === "product" ? productItems : categoryItems;

  useEffect(() => {
    if (activeList.length === 0) return;

    if (activeId === null || !activeList.some((item) => item.id === activeId)) {
      setActiveId(activeList[0].id);
    }
  }, [activeId, activeList]);

  useEffect(() => {
    if (targetLanguageOptions.includes(targetLanguage)) {
      setActiveTargetLanguage(targetLanguage);
    }
  }, [targetLanguage, targetLanguageOptions]);

  const activeItem =
    activeType === "product"
      ? productItems.find((item) => item.id === activeId)
      : categoryItems.find((item) => item.id === activeId);
  const activeProductItem =
    activeType === "product" ? (activeItem as ProductItem | undefined) : undefined;
  const activeCategoryItem =
    activeType === "category" ? (activeItem as CategoryItem | undefined) : undefined;

  const sourceDraft = useMemo(() => {
    if (!activeProductItem && !activeCategoryItem) {
      return { name: "", description: "" };
    }

    return {
      name:
        activeType === "product"
          ? getTranslationValue(
              activeProductItem?.product_translations,
              sourceLanguage,
              "name"
            )
          : getTranslationValue(
              activeCategoryItem?.category_translations,
              sourceLanguage,
              "name"
            ),
      description:
        activeType === "product"
          ? getTranslationValue(
              activeProductItem?.product_translations,
              sourceLanguage,
              "description"
            )
          : getTranslationValue(
              activeCategoryItem?.category_translations,
              sourceLanguage,
              "description"
            ),
    };
  }, [activeCategoryItem, activeProductItem, activeType, sourceLanguage]);

  // Helper function to check if a draft differs from original
  const isDraftDirty = (draftKey: string): boolean => {
    const draft = drafts[draftKey];
    const original = originals[draftKey];

    if (!draft || !original) return false;

    return (
      draft.name !== original.name || draft.description !== original.description
    );
  };

  const activeDraftKey = getDraftKey(
    activeType,
    activeId,
    activeTargetLanguage
  );

  const currentDraft = drafts[activeDraftKey] || {
    name: activeItem
      ? activeType === "product"
        ? getTranslationValue(
            activeProductItem?.product_translations,
            activeTargetLanguage,
            "name"
          )
        : getTranslationValue(
            activeCategoryItem?.category_translations,
            activeTargetLanguage,
            "name"
          )
      : "",
    description: activeItem
      ? activeType === "product"
        ? getTranslationValue(
            activeProductItem?.product_translations,
            activeTargetLanguage,
            "description"
          )
        : getTranslationValue(
            activeCategoryItem?.category_translations,
            activeTargetLanguage,
            "description"
          )
      : "",
  };

  const isActiveDraftDirty = isDraftDirty(activeDraftKey);
  const currentProgress = getCompletionPercent(sourceDraft, currentDraft);

  const summary = useMemo(() => {
    const buildSummary = (
      items: CategoryItem[] | ProductItem[],
      type: ItemType
    ) => {
      return items.map((item) => {
        const typedProductItem =
          type === "product" ? (item as ProductItem) : undefined;
        const typedCategoryItem =
          type === "category" ? (item as CategoryItem) : undefined;
        const source = {
          name:
            type === "product"
              ? getTranslationValue(
                  typedProductItem?.product_translations,
                  sourceLanguage,
                  "name"
                )
              : getTranslationValue(
                  typedCategoryItem?.category_translations,
                  sourceLanguage,
                  "name"
                ),
          description:
            type === "product"
              ? getTranslationValue(
                  typedProductItem?.product_translations,
                  sourceLanguage,
                  "description"
                )
              : getTranslationValue(
                  typedCategoryItem?.category_translations,
                  sourceLanguage,
                  "description"
                ),
        };
        const target = {
          name:
            type === "product"
              ? getTranslationValue(
                  typedProductItem?.product_translations,
                  activeTargetLanguage,
                  "name"
                )
              : getTranslationValue(
                  typedCategoryItem?.category_translations,
                  activeTargetLanguage,
                  "name"
                ),
          description:
            type === "product"
              ? getTranslationValue(
                  typedProductItem?.product_translations,
                  activeTargetLanguage,
                  "description"
                )
              : getTranslationValue(
                  typedCategoryItem?.category_translations,
                  activeTargetLanguage,
                  "description"
                ),
        };
        const progress = getCompletionPercent(source, target);
        const completed = getCompletedFieldCount(source, target);
        const required = getRequiredFieldCount(source);

        return { id: item.id, progress, completed, required };
      });
    };

    const productSummary = buildSummary(productItems, "product");
    const categorySummary = buildSummary(categoryItems, "category");

    const totalCompleted = [...productSummary, ...categorySummary].reduce(
      (count, item) => count + item.completed,
      0
    );
    const totalRequired = [...productSummary, ...categorySummary].reduce(
      (count, item) => count + item.required,
      0
    );

    return {
      productSummary,
      categorySummary,
      totalCompleted,
      totalRequired,
      productsFullyTranslated: productSummary.filter(
        (item) => item.required > 0 && item.progress === 100
      ).length,
      categoriesFullyTranslated: categorySummary.filter(
        (item) => item.required > 0 && item.progress === 100
      ).length,
    };
  }, [activeTargetLanguage, categoryItems, productItems, sourceLanguage]);

  const overallProgress =
    summary.totalRequired === 0
      ? 100
      : Math.round((summary.totalCompleted / summary.totalRequired) * 100);

  const syncUrl = (
    nextType: ItemType,
    nextId: number | null,
    nextTargetLanguage: string
  ) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("type", nextType);
    if (nextId !== null) {
      params.set("id", String(nextId));
    } else {
      params.delete("id");
    }
    params.set("target", nextTargetLanguage);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const getItemsByType = (type: ItemType) =>
    type === "product" ? productItems : categoryItems;

  const getItemIndex = (type: ItemType, id: number | null) => {
    if (id === null) return -1;
    return getItemsByType(type).findIndex((item) => item.id === id);
  };

  const getItemByMeta = ({ type, id }: Omit<DraftMeta, "targetLanguage">) => {
    const items = getItemsByType(type);
    return items.find((item) => item.id === id);
  };

  const moveToAdjacentItem = async (direction: -1 | 1) => {
    if (!activeItem || saving) return;

    const items = getItemsByType(activeType);
    const currentIndex = getItemIndex(activeType, activeId);
    if (currentIndex === -1) return;

    const nextItem = items[currentIndex + direction];
    if (!nextItem) return;

    setActiveId(nextItem.id);
    syncUrl(activeType, nextItem.id, activeTargetLanguage);
  };

  const saveDraftByMeta = async (
    meta: DraftMeta,
    draft: TranslationDraft
  ): Promise<boolean> => {
    const item = getItemByMeta(meta);
    if (!item) {
      return false;
    }

    if (meta.type === "product") {
      const productItem = item as ProductItem;
      const response = await fetch(`/api/admin/products/${productItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: productItem.price,
          currency: productItem.currency,
          category_id: productItem.category_id,
          image_url: productItem.image_url,
          is_available: productItem.is_available,
          translations: {
            [meta.targetLanguage]: {
              name: draft.name,
              description: draft.description,
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to save product translation");
      }

      return true;
    }

    const categoryItem = item as CategoryItem;
    const response = await fetch(`/api/admin/categories/${categoryItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: categoryItem.id,
        translations: {
          [meta.targetLanguage]: {
            name: draft.name,
            description: draft.description,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to save category translation");
    }

    return true;
  };

  const saveActiveItem = async () => {
    if (!activeItem) return false;
    if (!activeTargetLanguage) {
      toast.error("No target language available for translation");
      return false;
    }

    const draft = drafts[activeDraftKey] || currentDraft;
    const draftMeta: DraftMeta = {
      type: activeType,
      id: activeItem.id,
      targetLanguage: activeTargetLanguage,
    };

    setSaving(true);
    try {
      await saveDraftByMeta(draftMeta, draft);
      // Update originals to reflect the saved values
      setOriginals((previous) => ({
        ...previous,
        [activeDraftKey]: draft,
      }));
      toast.success("Translation saved");
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save translation"
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveAllDrafts = async () => {
    const pendingKeys = Object.keys(drafts).filter((key) => isDraftDirty(key));

    if (pendingKeys.length === 0) {
      toast.message("No unsaved translations");
      return;
    }

    setSaving(true);
    let successCount = 0;

    try {
      for (const pendingKey of pendingKeys) {
        const meta = parseDraftKey(pendingKey);
        const draft = drafts[pendingKey];

        if (!meta || !draft || !meta.targetLanguage) {
          continue;
        }

        try {
          const saved = await saveDraftByMeta(meta, draft);
          if (saved) {
            successCount += 1;
            // Update originals to reflect the saved values
            setOriginals((previous) => ({
              ...previous,
              [pendingKey]: draft,
            }));
          }
        } catch {
          // Continue saving remaining drafts.
        }
      }

      if (successCount === pendingKeys.length) {
        toast.success(`Saved ${successCount} translations`);
      } else {
        toast.error(`Saved ${successCount}/${pendingKeys.length} translations`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSelectItem = async (type: ItemType, id: number) => {
    setActiveType(type);
    setActiveId(id);
    syncUrl(type, id, activeTargetLanguage);
  };

  const handleTypeChange = async (type: ItemType) => {
    const items = getItemsByType(type);
    const nextItem = items[0] || null;
    setActiveType(type);
    setActiveId(nextItem?.id ?? null);
    syncUrl(type, nextItem?.id ?? null, activeTargetLanguage);
  };

  const handleTargetLanguageChange = async (nextTargetLanguage: string) => {
    setActiveTargetLanguage(nextTargetLanguage);
    syncUrl(activeType, activeId, nextTargetLanguage);
  };

  const activeCategoryName =
    activeType === "product" && activeProductItem
      ? categories.find((category) => category.id === activeProductItem.category_id)
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit lg:sticky lg:top-6">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Queue</CardTitle>
              <p className="text-sm text-muted-foreground">
                {getLanguageLabel(activeTargetLanguage, targetLanguageLabels)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={activeType === "product" ? "default" : "outline"}
                size="sm"
                onClick={() => void handleTypeChange("product")}
              >
                Products
              </Button>
              <Button
                type="button"
                variant={activeType === "category" ? "default" : "outline"}
                size="sm"
                onClick={() => void handleTypeChange("category")}
              >
                Categories
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border bg-muted/40 p-3">
            <div className="flex items-center justify-between text-sm">
              <span>Overall</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <strong className="block text-foreground">
                  {summary.productsFullyTranslated}
                </strong>
                Products complete
              </div>
              <div>
                <strong className="block text-foreground">
                  {summary.categoriesFullyTranslated}
                </strong>
                Categories complete
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{activeList.length} items</span>
            <span>
              {getLanguageLabel(sourceLanguage, targetLanguageLabels)} →{" "}
              {getLanguageLabel(activeTargetLanguage, targetLanguageLabels)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {activeList.map((item) => {
            const queueProductItem =
              activeType === "product" ? (item as ProductItem) : undefined;
            const queueCategoryItem =
              activeType === "category" ? (item as CategoryItem) : undefined;
            const itemSource =
              activeType === "product"
                ? {
                    name: getTranslationValue(
                      queueProductItem?.product_translations,
                      sourceLanguage,
                      "name"
                    ),
                    description: getTranslationValue(
                      queueProductItem?.product_translations,
                      sourceLanguage,
                      "description"
                    ),
                  }
                : {
                    name: getTranslationValue(
                      queueCategoryItem?.category_translations,
                      sourceLanguage,
                      "name"
                    ),
                    description: getTranslationValue(
                      queueCategoryItem?.category_translations,
                      sourceLanguage,
                      "description"
                    ),
                  };
            const itemTarget =
              activeType === "product"
                ? {
                    name: getTranslationValue(
                      queueProductItem?.product_translations,
                      activeTargetLanguage,
                      "name"
                    ),
                    description: getTranslationValue(
                      queueProductItem?.product_translations,
                      activeTargetLanguage,
                      "description"
                    ),
                  }
                : {
                    name: getTranslationValue(
                      queueCategoryItem?.category_translations,
                      activeTargetLanguage,
                      "name"
                    ),
                    description: getTranslationValue(
                      queueCategoryItem?.category_translations,
                      activeTargetLanguage,
                      "description"
                    ),
                  };
            const percent = getCompletionPercent(itemSource, itemTarget);
            const isActive = item.id === activeId;
            const queueItemDraftKey = getDraftKey(
              activeType,
              item.id,
              activeTargetLanguage
            );
            const isNotSaved = isDraftDirty(queueItemDraftKey);
            const label =
              activeType === "product"
                ? itemSource.name || `Product #${item.id}`
                : itemSource.name || `Category #${item.id}`;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => void handleSelectItem(activeType, item.id)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-colors",
                  isActive ? "border-primary bg-primary/5" : "hover:bg-muted/60"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{label}</div>
                    {activeType === "product" &&
                    activeItem &&
                    item.id === activeItem.id &&
                    activeCategoryName ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {activeCategoryName.category_translations?.[0]?.name ||
                          "Category"}
                      </div>
                    ) : null}
                    {isNotSaved ? (
                      <div className="mt-1 text-xs font-medium text-amber-700">
                        Not saved
                      </div>
                    ) : null}
                  </div>
                  <Badge variant={percent === 100 ? "default" : "outline"}>
                    {percent}%
                  </Badge>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>
                  {activeType === "product"
                    ? "Product Translation"
                    : "Category Translation"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {activeItem
                    ? `Editing item #${activeItem.id}`
                    : "Select an item to start translating"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {hasTargetLanguages ? (
                  <select
                    value={activeTargetLanguage}
                    onChange={(event) =>
                      void handleTargetLanguageChange(event.target.value)
                    }
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {targetLanguageOptions.map((language) => (
                      <option key={language} value={language}>
                        {getLanguageLabel(language, targetLanguageLabels)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="h-10 rounded-md border border-input bg-muted/40 px-3 text-sm flex items-center text-muted-foreground">
                    Add another menu language to start translating
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void moveToAdjacentItem(-1)}
                    disabled={!activeItem || saving}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void moveToAdjacentItem(1)}
                    disabled={!activeItem || saving}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  onClick={() => void saveActiveItem()}
                  disabled={
                    !activeItem ||
                    saving ||
                    !hasTargetLanguages ||
                    !isActiveDraftDirty
                  }
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Current
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void saveAllDrafts()}
                  disabled={
                    saving ||
                    !hasTargetLanguages ||
                    Object.keys(drafts).filter((key) => isDraftDirty(key))
                      .length === 0
                  }
                >
                  Save All (
                  {
                    Object.keys(drafts).filter((key) => isDraftDirty(key))
                      .length
                  }
                  )
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border bg-muted/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span>Current item</span>
                <span>{currentProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {activeItem ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-2xl border bg-muted/20 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Original
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {getLanguageLabel(sourceLanguage, targetLanguageLabels)}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Name
                      </label>
                      <Input
                        value={sourceDraft.name}
                        readOnly
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Description
                      </label>
                      <Textarea
                        value={sourceDraft.description}
                        readOnly
                        rows={8}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border bg-background p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Translation
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {getLanguageLabel(
                        activeTargetLanguage,
                        targetLanguageLabels
                      )}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Name
                      </label>
                      <Input
                        value={currentDraft.name}
                        onChange={(event) => {
                          setDrafts((previous) => ({
                            ...previous,
                            [activeDraftKey]: {
                              ...currentDraft,
                              name: event.target.value,
                            },
                          }));
                        }}
                        placeholder="Enter translation"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Description
                      </label>
                      <Textarea
                        value={currentDraft.description}
                        onChange={(event) => {
                          setDrafts((previous) => ({
                            ...previous,
                            [activeDraftKey]: {
                              ...currentDraft,
                              description: event.target.value,
                            },
                          }));
                        }}
                        rows={8}
                        placeholder="Enter translation"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
                No items available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
