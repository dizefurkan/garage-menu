/**
 * Product Editor Page - CRUD with Multi-Language Support
 * @path app/admin/products/[id]/edit/page.tsx
 *
 * Features:
 * - Create/Edit product
 * - Multi-language tabs (TR, EN)
 * - Image upload
 * - Category selector
 * - Price input
 * - Draft/Publish toggle
 * - Using shadcn/ui components: Form, Input, Tabs, Button, etc.
 */

"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// shadcn/ui imports
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Save, Loader2, Trash2 } from "lucide-react";

import { CreateProductSchema, type CreateProductInput } from "@/lib/db/schema";
import { createProduct, updateProduct, deleteProduct } from "@/lib/db/queries";

const LANGUAGES = ["tr", "en"] as const;
const MOCK_CATEGORIES = [
  { id: 1, name: "Breakfast" },
  { id: 2, name: "Desserts" },
  { id: 3, name: "Beverages" },
];

export default function ProductEditorPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string | undefined;
  const isNew = productId === "new";

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof LANGUAGES)[number]>("tr");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form setup with zod validation
  const form = useForm<CreateProductInput>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      category_id: 1,
      price: 0,
      is_draft: true,
      translations: {
        tr: { name: "", description: "" },
        en: { name: "", description: "" },
      },
    },
  });

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================
  async function onSubmit(data: CreateProductInput) {
    setIsSaving(true);
    try {
      if (imageUrl) {
        data.image_url = imageUrl;
      }

      if (isNew) {
        await createProduct(data);
      } else {
        await updateProduct({
          id: BigInt(productId),
          ...data,
        });
      }

      router.push("/admin/products");
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    } finally {
      setIsSaving(false);
    }
  }

  // ============================================================================
  // IMAGE UPLOAD
  // ============================================================================
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Upload to /api/upload endpoint (create this separately)
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await response.json();
      setImageUrl(url);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  }

  // ============================================================================
  // DELETE PRODUCT
  // ============================================================================
  async function handleDelete() {
    if (!productId || isNew) return;
    if (!confirm("Are you sure you want to delete this product?")) return;

    setIsSaving(true);
    try {
      await deleteProduct(BigInt(productId));
      router.push("/admin/products");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isNew ? "New Product" : "Edit Product"}
          </h1>
          <p className="text-gray-600">Add or update product details</p>
        </div>
        {!isNew && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isSaving}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
      </div>

      {/* Main Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Price, category, and image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (TRY)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload */}
              <div>
                <FormLabel>Product Image</FormLabel>
                <div className="mt-2 flex items-center gap-4">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-32 w-32 rounded object-cover"
                    />
                  )}
                  <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-8 py-6 cursor-pointer hover:border-gray-400">
                    <Upload className="h-6 w-6 text-gray-600" />
                    <span className="mt-2 text-sm font-medium text-gray-700">
                      {isUploading ? "Uploading..." : "Click to upload"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Translations Card */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                Name and description in each language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as any)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  {LANGUAGES.map((lang) => (
                    <TabsTrigger key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {LANGUAGES.map((lang) => (
                  <TabsContent key={lang} value={lang} className="space-y-4">
                    {/* Product Name */}
                    <FormField
                      control={form.control}
                      name={`translations.${lang}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Döner Kebab" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Product Description */}
                    <FormField
                      control={form.control}
                      name={`translations.${lang}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Product description..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: Add details about ingredients,
                            preparation, etc.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Publish Status */}
          <Card>
            <CardHeader>
              <CardTitle>Publish Status</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="is_draft"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={!field.value}
                        onChange={(e) => field.onChange(!e.target.checked)}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel>
                      Publish this product (make it visible)
                    </FormLabel>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Product
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
