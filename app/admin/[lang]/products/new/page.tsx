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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTenant } from "@/lib/context/tenant-context";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  AllergenSelector,
  type AllergenOption,
} from "../allergen-selector";

const productSchema = z.object({
  price: z.coerce.number().min(0).max(999999),
  currency: z.string().default("TRY"),
  is_available: z.boolean().default(true),
  category_id: z.coerce.number(),
  image_url: z.string().optional().nullable(),
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

export default function ProductFormPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const params = useParams();
  const tenant = useTenant();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [allergens, setAllergens] = useState<AllergenOption[]>([]);

  const productId = params?.id as string | undefined;
  const isEdit = !!productId;
  const currentLang = (params?.lang as string) || "en";

  useEffect(() => {
    setIsEditMode(isEdit);
  }, [isEdit]);

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/admin/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Fetch allergens
  useEffect(() => {
    async function loadAllergens() {
      try {
        const response = await fetch(`/api/admin/allergens?lang=${currentLang}`);
        if (response.ok) {
          const data = await response.json();
          setAllergens(data);
        }
      } catch (err) {
        console.error("Failed to load allergens:", err);
      }
    }
    loadAllergens();
  }, [currentLang]);

  const languages = tenant.languages || ["en"];

  // Initialize translations for all tenant languages
  const defaultTranslations: Record<string, any> = {};
  const tenantLanguages = tenant.languages || ["en"];
  for (const lang of tenantLanguages) {
    defaultTranslations[lang] = {
      name: "",
      description: "",
    };
  }

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
      translations: defaultTranslations,
      allergen_ids: [],
      contains_no_allergens: false,
    },
  });

  async function onSubmit(data: ProductFormData) {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save product");
      }

      toast.success(t("productCreated"));
      setTimeout(() => router.push("/admin/products"), 1000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("productSaveFailed")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">
        {isEditMode ? t("editProduct") : t("newProduct")}
      </h1>

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
                  defaultValue="TRY"
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
                  onValueChange={(value) =>
                    setValue("category_id", Number(value as string))
                  }
                >
                  <SelectTrigger className="!h-10 w-full">
                    <SelectValue placeholder={t("selectCategory")} />
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

            {/* Availability */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_available"
                checked={watch("is_available")}
                onCheckedChange={(checked) =>
                  setValue("is_available", Boolean(checked))
                }
              />
              <label
                htmlFor="is_available"
                className="text-sm font-medium cursor-pointer"
              >
                {t("availableForSale")}
              </label>
            </div>

            {/* Image Upload */}
            <div className="flex flex-col">
              <label className="mb-2 block text-sm font-medium">
                {t("productImage")}
              </label>
              <ImageUpload
                value={watch("image_url")}
                onChange={(url) => setValue("image_url", url)}
                disabled={loading}
                tenantId={tenant?.id?.toString()}
              />
            </div>

            {/* Allergens */}
            <AllergenSelector
              allergens={allergens}
              selectedIds={watch("allergen_ids") || []}
              containsNoAllergens={watch("contains_no_allergens") || false}
              onChange={(ids, noAllergens) => {
                setValue("allergen_ids", ids);
                setValue("contains_no_allergens", noAllergens);
              }}
              disabled={loading}
            />

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading
                  ? isEditMode
                    ? t("saving")
                    : t("creating")
                  : isEditMode
                    ? t("save")
                    : t("create")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                {t("cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
