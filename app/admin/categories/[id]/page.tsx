"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { useTenant } from "@/lib/context/tenant-context";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const tenant = useTenant();
  const categoryId = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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

        // Initialize form with translations
        const languages = tenant.languages || ["en"];
        const initialData = languages.reduce(
          (acc, lang) => {
            const translation = data.category_translations?.find(
              (t: any) => t.language_code === lang
            );
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
        setError(err instanceof Error ? err.message : "Veri yüklenmede hata");
      } finally {
        setLoading(false);
      }
    }

    if (categoryId) {
      loadCategory();
    }
  }, [categoryId, tenant]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/admin/categories");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const languages = tenant.languages || ["en"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // Validate that at least one language has a name
    const hasAnyName = Object.values(formData).some((lang) => lang.name.trim());
    if (!hasAnyName) {
      setError("En az bir kategori adı gereklidir");
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
        throw new Error(errorData.error || "Kategori güncellemesi başarısız");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu");
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
          <h1 className="text-3xl font-bold">Kategoriyi Düzenle</h1>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Hata</AlertTitle>
          <AlertDescription className="text-red-700">
            Kategori bulunamadı
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Kategoriyi Düzenle</h1>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Başarılı!</AlertTitle>
          <AlertDescription className="text-green-700">
            Kategori başarıyla güncellendi! Yönlendiriliyorsunuz...
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Hata</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

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
