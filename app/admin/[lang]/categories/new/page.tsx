"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/lib/context/tenant-context";
import { useTranslations } from "next-intl";
import { ImageUpload } from "@/components/ui/image-upload";
import { uploadImageFile } from "@/lib/deferred-uploads";
import { getLanguageName } from "@/lib/language-flags";

export default function CategoryFormPage() {
  const router = useRouter();
  const params = useParams();
  const tenant = useTenant();
  const t = useTranslations("admin");
  const tf = useTranslations("categoryForm");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<
    Record<string, { name: string; description: string }>
  >({});

  const categoryId = params?.id as string | undefined;
  const isEdit = !!categoryId;

  useEffect(() => {
    setIsEditMode(isEdit);
    // Initialize form data with selected languages
    const languages = tenant.languages || ["en"];
    const initialData = languages.reduce(
      (acc, lang) => {
        acc[lang] = { name: "", description: "" };
        return acc;
      },
      {} as Record<string, { name: string; description: string }>
    );
    setFormData(initialData);
  }, [tenant, isEdit]);

  const languages = tenant.languages || ["en"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Validate that at least one language has a name
    const hasAnyName = Object.values(formData).some((lang) => lang.name.trim());
    if (!hasAnyName) {
      toast.error(tf("nameRequired"));
      setLoading(false);
      return;
    }

    try {
      // Deferred upload: the file only leaves the browser once the user
      // actually commits the form.
      const uploadedUrl = pendingImageFile
        ? await uploadImageFile(pendingImageFile)
        : null;

      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translations: formData,
          image_url: uploadedUrl ?? imageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tf("createFailed"));
      }

      toast.success(tf(isEditMode ? "updated" : "created"));
      setTimeout(() => router.push("/admin/categories"), 1000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : tf("createFailed")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">
        {tf(isEditMode ? "editTitle" : "newTitle")}
      </h1>

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

              {(languages as readonly string[]).map((lang) => (
                <TabsContent key={lang} value={lang} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {tf("nameLabel", { lang: lang.toUpperCase() })}
                    </label>
                    <Input
                      placeholder={tf("namePlaceholder")}
                      value={formData[lang]?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [lang]: { ...formData[lang], name: e.target.value },
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {tf("descriptionLabel", { lang: lang.toUpperCase() })}
                    </label>
                    <Textarea
                      placeholder={tf("descriptionPlaceholder")}
                      value={formData[lang]?.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [lang]: {
                            ...formData[lang],
                            description: e.target.value,
                          },
                        })
                      }
                      rows={3}
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
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {t("categoryImageHint")}
              </p>
            </div>


            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading
                  ? tf(isEditMode ? "saving" : "creating")
                  : tf(isEditMode ? "save" : "create")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                {tf("cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
