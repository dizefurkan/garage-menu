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

export default function CategoryFormPage() {
  const router = useRouter();
  const params = useParams();
  const tenant = useTenant();
  const [loading, setLoading] = useState(false);
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
      toast.error("At least one category name is required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translations: formData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save category");
      }

      toast.success("Category created successfully!");
      setTimeout(() => router.push("/admin/categories"), 1000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save category"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">
        {isEditMode ? "Edit Category" : "New Category"}
      </h1>

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

              {(languages as readonly string[]).map((lang) => (
                <TabsContent key={lang} value={lang} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Category Name ({lang.toUpperCase()})
                    </label>
                    <Input
                      placeholder="e.g. Desserts"
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
                      Description ({lang.toUpperCase()})
                    </label>
                    <Textarea
                      placeholder="Optional description..."
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

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save"
                    : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
