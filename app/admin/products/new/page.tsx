'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const productSchema = z.object({
  price: z.coerce.number().min(0).max(999999),
  currency: z.string().default('TRY'),
  is_available: z.boolean().default(true),
  category_id: z.coerce.number(),
  translations: z.record(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductFormPage({ 
  params 
}: { 
  params: Promise<{ id?: string }> 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  async function onSubmit(data: ProductFormData) {
    setLoading(true);
    setError(null);

    try {
      // Send to server action - you'll create this
      // const result = await createOrUpdateProduct(data);
      // router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">New Product</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Multi-language Tabs */}
            <Tabs defaultValue="en">
              <TabsList>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="tr">Türkçe</TabsTrigger>
              </TabsList>

              {(['en', 'tr'] as const).map((lang) => (
                <TabsContent key={lang} value={lang} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Product Name ({lang.toUpperCase()})
                    </label>
                    <Input
                      placeholder="e.g. Chocolate Croissant"
                      {...register(`translations.${lang}.name`)}
                    />
                    {errors.translations?.[lang]?.name && (
                      <p className="mt-1 text-sm text-red-600">Required</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Description ({lang.toUpperCase()})
                    </label>
                    <Textarea
                      placeholder="Describe your product..."
                      {...register(`translations.${lang}.description`)}
                      rows={4}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Price & Category */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">Price</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('price')}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Currency</label>
                <Input
                  {...register('currency')}
                  defaultValue="TRY"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Category</label>
                <select
                  {...register('category_id')}
                  className="w-full rounded border"
                >
                  <option value="">Select category</option>
                  {/* TODO: Fetch categories from DB */}
                </select>
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('is_available')}
                defaultChecked
              />
              <label className="text-sm font-medium">Available for sale</label>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Product'}
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
