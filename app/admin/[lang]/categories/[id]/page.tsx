"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { ImageUpload } from "@/components/ui/image-upload";
import { uploadImageFile } from "@/lib/deferred-uploads";
import { useTenant } from "@/lib/context/tenant-context";
import { getLanguageName } from "@/lib/language-flags";

export default function EditCategoryPage() {
  const t = useTranslations("admin");
  const tf = useTranslations("categoryForm");
  const router = useRouter();
  const params = useParams();
  const tenant = useTenant();
  const categoryId = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<any>(null);
  const [formData, setFormData] = useState<
    Record<string, { name: string; description: string }>
  >({});
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  // Fetch category and initialize form
  useEffect(() => {
    async function loadCategory() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/categories/${categoryId}`);
        if (!response.ok) {
          throw new Error(tf("notFound"));
        }

        const data = await response.json();
        setCategory(data);
        setImageUrl(data.image_url ?? null);

        // Initialize form with translations for ALL tenant languages
        const languages = tenant.languages || ["en"];
        const initialData = languages.reduce(
          (acc, lang) => {
            const translation = data.category_translations?.find(
              (t: any) => t.language_code === lang
            );
            // Use existing translation or empty string for new languages
            acc[lang] = {
              name: translation?.name || "",
              description: translation?.description || "",
            };
            return acc;
          },
          {} as Record<string, { name: string; description: string }>
        );
        setFormData(initialData);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : tf("loadFailed")
        );
      } finally {
        setLoading(false);
      }
    }

    if (categoryId) {
      loadCategory();
    }
  }, [categoryId, tenant]);

  const languages = tenant.languages || ["en"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    // Validate that at least one language has a name
    const hasAnyName = Object.values(formData).some((lang) => lang.name.trim());
    if (!hasAnyName) {
      toast.error(tf("nameRequired"));
      setSaving(false);
      return;
    }

    try {
      // Upload the picked file only now that the user is committing, the
      // same deferred pattern the product form uses.
      const uploadedUrl = pendingImageFile
        ? await uploadImageFile(pendingImageFile)
        : null;

      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translations: formData,
          image_url: uploadedUrl ?? imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || tf("updateFailed"));
      }

      toast.success(tf("updated"));
      setTimeout(() => router.push("/admin/categories"), 1000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : tf("updateFailed")
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">{tf("editTitle")}</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">{tf("loading")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{tf("editTitle")}</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">{tf("notFound")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{tf("editTitle")}</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue={languages[0] || "en"}>
              <TabsList>
                {languages.map((lang) => (
                  <TabsTrigger key={lang} value={lang}>
                    {getLanguageName(lang)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {languages.map((lang) => (
                <TabsContent key={lang} value={lang} className="space-y-4">
                  <div className="flex flex-col">
                    <label className="mb-2 block text-sm font-medium">
                      {tf("nameLabel", { lang: lang.toUpperCase() })}
                    </label>
                    <Input
                      type="text"
                      placeholder={tf("namePlaceholder")}
                      value={formData[lang]?.name || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [lang]: {
                            ...prev[lang],
                            name: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-2 block text-sm font-medium">
                      {tf("descriptionLabel", { lang: lang.toUpperCase() })}
                    </label>
                    <Textarea
                      placeholder={tf("descriptionPlaceholder")}
                      value={formData[lang]?.description || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [lang]: {
                            ...prev[lang],
                            description: e.target.value,
                          },
                        }))
                      }
                      rows={4}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                {t("categoryImageTitle")}
              </label>
              <ImageUpload
                value={imageUrl ?? undefined}
                onChange={(url) => setImageUrl(url || null)}
                onFileSelect={setPendingImageFile}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                {t("categoryImageHint")}
              </p>
            </div>


            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                İptal
              </Button>
              <Button type="submit" disabled={saving}>
                {tf(saving ? "saving" : "save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
