"use client";

import { useState } from "react";
import Image from "next/image";
import type { Database } from "@/lib/database.types";

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  product_translations: Array<{
    language_code: string;
    name: string;
    description: string;
  }>;
};

type Category = Database["public"]["Tables"]["categories"]["Row"] & {
  category_translations: Array<{
    language_code: string;
    name: string;
  }>;
};

type MenuEditorProps = {
  categories: Category[];
  products: Product[];
};

// Helper to get translation by language
function getTrans(
  translations: Array<{ language_code: string; [key: string]: unknown }>,
  lang: string,
  key: string
): string {
  const trans = translations.find((t) => t.language_code === lang);
  return ((trans?.[key as keyof typeof trans] as string) || "") as string;
}

function getCategoryName(
  categories: Category[],
  categoryId: number,
  lang: string
): string {
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return "";
  return getTrans(cat.category_translations, lang, "name");
}

export default function MenuEditor({ categories, products }: MenuEditorProps) {
  const [productsList, setProductsList] = useState<Product[]>(products);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  async function handleUploadImage(
    productId: number,
    file: File
  ): Promise<string | null> {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as {
        publicUrl?: string;
        filename?: string;
        error?: string;
      } | null;

      if (!response.ok || !data?.publicUrl) {
        throw new Error(data?.error || "Failed to upload image");
      }

      return data.publicUrl;
    } catch (error) {
      setStatusMessage(
        `Resim yükleme hatası: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`
      );
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleUpdateProduct(
    productId: number,
    updates: Partial<{
      category_id: number;
      price: number;
      image_url: string | null;
      translations: Record<string, { name: string; description: string }>;
    }>
  ) {
    setIsSaving(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/products", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          ...updates,
        }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(error?.error || "Ürün güncellenemedi");
      }

      // Refresh the product in local state
      setProductsList((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...updates } : p))
      );
    } catch (error) {
      setStatusMessage(
        `Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteProduct(productId: number) {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;

    setIsSaving(true);

    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId }),
      });

      if (!response.ok) {
        throw new Error("Ürün silinirken hata oluştu");
      }

      setProductsList((prev) => prev.filter((p) => p.id !== productId));
      setStatusMessage("✓ Ürün silindi");
    } catch (error) {
      setStatusMessage(
        `Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddProduct() {
    const firstCategory = categories[0];
    if (!firstCategory) {
      setStatusMessage("Kategori bulunamadı");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: firstCategory.id,
          price: 0,
          translations: {
            tr: { name: "Yeni Ürün", description: "" },
            en: { name: "New Product", description: "" },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Ürün oluşturulamadı");
      }

      setStatusMessage("✓ Yeni ürün eklendi. Sayfayı yenilemek gerekebilir");
    } catch (error) {
      setStatusMessage(
        `Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#890333]/15 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#890333]">
            Ürünleri Düzenle ({productsList.length})
          </h2>
          <button
            onClick={handleAddProduct}
            disabled={isSaving}
            className="rounded border-2 border-dashed border-[#890333] px-3 py-1 text-sm text-[#890333] disabled:opacity-50"
          >
            + Yeni
          </button>
        </div>

        {statusMessage && (
          <div className="mb-4 rounded bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {statusMessage}
          </div>
        )}

        <div className="max-h-96 space-y-4 overflow-y-auto">
          {productsList.map((product) => {
            const nameTr = getTrans(product.product_translations, "tr", "name");
            const nameEn = getTrans(product.product_translations, "en", "name");
            const descTr = getTrans(
              product.product_translations,
              "tr",
              "description"
            );
            const descEn = getTrans(
              product.product_translations,
              "en",
              "description"
            );

            return (
              <div
                key={product.id}
                className="rounded border border-gray-200 p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      #{product.id} - {nameTr || nameEn}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {getCategoryName(categories, product.category_id, "tr")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    disabled={isSaving}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>

                {/* Image Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium">Resim</label>
                  <div className="mt-1 flex items-center gap-2">
                    {product.image_url && (
                      <Image
                        src={product.image_url}
                        alt={nameTr}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading || isSaving}
                      onChange={async (e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) {
                          const url = await handleUploadImage(product.id, file);
                          if (url) {
                            await handleUpdateProduct(product.id, {
                              image_url: url,
                            });
                          }
                        }
                      }}
                      className="flex-1 text-sm"
                    />
                  </div>
                </div>

                {/* Category & Price */}
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium">
                      Kategori
                    </label>
                    <select
                      value={product.category_id}
                      onChange={(e) =>
                        handleUpdateProduct(product.id, {
                          category_id: parseInt(e.target.value),
                        })
                      }
                      disabled={isSaving}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {getTrans(cat.category_translations, "tr", "name")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Fiyat</label>
                    <input
                      type="number"
                      step="0.01"
                      value={product.price}
                      onChange={(e) =>
                        handleUpdateProduct(product.id, {
                          price: parseFloat(e.target.value),
                        })
                      }
                      disabled={isSaving}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Names */}
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium">
                      Türkçe Ad
                    </label>
                    <input
                      type="text"
                      value={nameTr}
                      onChange={(e) =>
                        handleUpdateProduct(product.id, {
                          translations: {
                            tr: { name: e.target.value, description: descTr },
                          },
                        })
                      }
                      disabled={isSaving}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      English Name
                    </label>
                    <input
                      type="text"
                      value={nameEn}
                      onChange={(e) =>
                        handleUpdateProduct(product.id, {
                          translations: {
                            en: { name: e.target.value, description: descEn },
                          },
                        })
                      }
                      disabled={isSaving}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium">
                      Türkçe Açıklama
                    </label>
                    <textarea
                      value={descTr}
                      onChange={(e) =>
                        handleUpdateProduct(product.id, {
                          translations: {
                            tr: { name: nameTr, description: e.target.value },
                          },
                        })
                      }
                      disabled={isSaving}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      English Description
                    </label>
                    <textarea
                      value={descEn}
                      onChange={(e) =>
                        handleUpdateProduct(product.id, {
                          translations: {
                            en: { name: nameEn, description: e.target.value },
                          },
                        })
                      }
                      disabled={isSaving}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
