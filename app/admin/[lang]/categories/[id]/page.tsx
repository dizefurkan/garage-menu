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
import { useTenant } from "@/lib/context/tenant-context";

export default function EditCategoryPage() {
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

  // Fetch category and initialize form
  useEffect(() => {
    async function loadCategory() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/categories/${categoryId}`);
        if (!response.ok) {
          throw new Error("Kategori bulunamadı");
        }

        const data = await response.json();
        setCategory(data);

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
          err instanceof Error ? err.message : "Failed to load category"
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
      toast.error("At least one category name is required");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translations: formData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update category");
      }

      toast.success("Category updated successfully!");
      setTimeout(() => router.push("/admin/categories"), 1000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update category"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Kategoriyi Düzenle</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Yükleniyor...</p>
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
          <h1 className="text-3xl font-bold">Edit Category</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Category not found</p>
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
        <h1 className="text-3xl font-bold">Edit Category</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue={languages[0] || "en"}>
              <TabsList>
                {languages.map((lang) => (
                  <TabsTrigger key={lang} value={lang}>
                    {lang === "en" ? "English" : "Türkçe"}
                  </TabsTrigger>
                ))}
              </TabsList>

              {languages.map((lang) => (
                <TabsContent key={lang} value={lang} className="space-y-4">
                  <div className="flex flex-col">
                    <label className="mb-2 block text-sm font-medium">
                      Kategori Adı ({lang.toUpperCase()})
                    </label>
                    <Input
                      type="text"
                      placeholder="örn. Pasta ve Tatlılar"
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
                      Açıklama ({lang.toUpperCase()})
                    </label>
                    <Textarea
                      placeholder="Kategoriyi açıklayın..."
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
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
