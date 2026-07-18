"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTenant } from "@/lib/context/tenant-context";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  AllergenSelector,
  type AllergenOption,
} from "../allergen-selector";
import { ModelUploadSection } from "../model-upload-section";

const productSchema = z.object({
  price: z.coerce.number().min(0).max(999999),
  currency: z.string().default("TRY"),
  is_available: z.boolean().default(true),
  category_id: z.coerce.number(),
  image_url: z.string().optional().nullable(),
  model_glb_url: z.string().optional().nullable(),
  model_usdz_url: z.string().optional().nullable(),
  allergen_ids: z.array(z.number()).default([]),
  contains_no_allergens: z.boolean().default(false),
  translations: z.record(
    z.string(),
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    })
  ),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const params = useParams();
  const tenant = useTenant();
  const productId = params?.id as string | undefined;
  const currentLang = (params?.lang as string) || "en";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [allergens, setAllergens] = useState<AllergenOption[]>([]);
  const [product, setProduct] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      is_available: true,
      currency: "TRY",
    },
  });

  // Fetch product and categories
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch product
        const productRes = await fetch(`/api/admin/products/${productId}`);
        if (!productRes.ok) {
          throw new Error(t("productNotFound"));
        }
        const productData = await productRes.json();
        setProduct(productData);

        // Parse translations into form structure
        // IMPORTANT: Initialize ALL tenant languages, not just existing ones
        const translations: Record<string, any> = {};

        // First, initialize empty translations for all tenant languages
        const tenantLanguages = tenant.languages || ["en"];
        for (const lang of tenantLanguages) {
          translations[lang] = {
            name: "",
            description: "",
          };
        }

        // Then, populate with existing translations from DB
        productData.product_translations?.forEach((trans: any) => {
          translations[trans.language_code] = {
            name: trans.name,
            description: trans.description || "",
          };
        });

        // Set form values
        setValue("price", productData.price);
        setValue("currency", productData.currency);
        setValue("is_available", productData.is_available || true);
        setValue("category_id", productData.category_id);
        setValue("image_url", productData.image_url || null);
        setValue("model_glb_url", productData.model_glb_url || null);
        setValue("model_usdz_url", productData.model_usdz_url || null);
        setValue("translations", translations);
        setValue(
          "allergen_ids",
          productData.product_allergens?.map((pa: any) => pa.allergen_id) ?? []
        );
        setValue(
          "contains_no_allergens",
          productData.contains_no_allergens ?? false
        );

        // Fetch categories
        const catRes = await fetch("/api/admin/categories");
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }

        // Fetch allergens
        const allergenRes = await fetch(
          `/api/admin/allergens?lang=${currentLang}`
        );
        if (allergenRes.ok) {
          const allergenData = await allergenRes.json();
          setAllergens(allergenData);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("productLoadFailed")
        );
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadData();
    }
  }, [productId, setValue, currentLang]);

  async function onSubmit(data: ProductFormData) {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }

      toast.success(t("productUpdated"));
      setTimeout(() => router.push("/admin/products"), 1000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("productSaveFailed")
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">{t("editProduct")}</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">{t("loading")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{t("editProduct")}</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">{t("productNotFound")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard language first, remaining tenant languages after
  const tenantLanguagesList = tenant.languages || ["en"];
  const languages = tenantLanguagesList.includes(currentLang)
    ? [currentLang, ...tenantLanguagesList.filter((l) => l !== currentLang)]
    : tenantLanguagesList;
  const selectedCategoryId = watch("category_id");
  const selectedCategoryName = categories.find(
    (cat) => cat.id === selectedCategoryId
  )?.name;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{t("editProduct")}</h1>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-2">
          <div>
            <p className="text-sm font-medium">
              {watch("is_available")
                ? `🟢 ${t("availableForSale")}`
                : `🔴 ${t("notAvailableForSale")}`}
            </p>
          </div>
          <Switch
            checked={watch("is_available")}
            onCheckedChange={(checked) => {
              setValue("is_available", checked);
            }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Multi-language Tabs */}
            <Tabs defaultValue={languages[0] || "en"}>
              <TabsList>
                {languages.map((lang) => (
                  <TabsTrigger key={lang} value={lang}>
                    {lang === "en" ? "English" : "Türkçe"}
                  </TabsTrigger>
                ))}
              </TabsList>

              {(languages as readonly string[]).map((lang) => (
                <TabsContent key={lang} value={lang} className="space-y-4">
                  <div className="flex flex-col">
                    <label className="mb-2 block text-sm font-medium">
                      {t("productName")} ({lang.toUpperCase()})
                    </label>
                    <Input
                      placeholder={t("productNamePlaceholder")}
                      {...register(`translations.${lang}.name`)}
                      className="h-10 w-full"
                    />
                    {errors.translations?.[lang]?.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {t("required")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-2 block text-sm font-medium">
                      {t("description")} ({lang.toUpperCase()})
                    </label>
                    <Textarea
                      placeholder={t("descriptionPlaceholder")}
                      {...register(`translations.${lang}.description`)}
                      className="w-full"
                      rows={4}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Price & Currency & Category */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col">
                <label className="mb-2 block text-sm font-medium">
                  {t("price")}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("price")}
                  className="h-10 w-full"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-2 block text-sm font-medium">
                  {t("currency")}
                </label>
                <Select
                  onValueChange={(value) =>
                    setValue("currency", value as string)
                  }
                  defaultValue={watch("currency") || "TRY"}
                >
                  <SelectTrigger className="!h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">Turkish Lira (₺)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 block text-sm font-medium">
                  {t("category")}
                </label>
                <Select
                  value={watch("category_id")?.toString() || ""}
                  onValueChange={(value) =>
                    setValue("category_id", Number(value as string))
                  }
                >
                  <SelectTrigger className="!h-10 w-full">
                    {selectedCategoryName ? (
                      <span>{selectedCategoryName}</span>
                    ) : (
                      <SelectValue placeholder={t("selectCategory")} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image Upload */}
            <div className="flex flex-col">
              <label className="mb-2 block text-sm font-medium">
                {t("productImage")}
              </label>
              <ImageUpload
                value={watch("image_url")}
                onChange={(url) => setValue("image_url", url)}
                disabled={saving}
                tenantId={tenant?.id?.toString()}
              />
            </div>

            {/* 3D / AR Model */}
            <ModelUploadSection
              glbUrl={watch("model_glb_url")}
              usdzUrl={watch("model_usdz_url")}
              onGlbChange={(url) => setValue("model_glb_url", url)}
              onUsdzChange={(url) => setValue("model_usdz_url", url)}
              disabled={saving}
            />

            {/* Allergens */}
            <AllergenSelector
              allergens={allergens}
              selectedIds={watch("allergen_ids") || []}
              containsNoAllergens={watch("contains_no_allergens") || false}
              onChange={(ids, noAllergens) => {
                setValue("allergen_ids", ids);
                setValue("contains_no_allergens", noAllergens);
              }}
              disabled={saving}
            />

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t("saving") : t("save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
