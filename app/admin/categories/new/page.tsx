'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CategoryFormPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    en: { name: '', description: '' },
    tr: { name: '', description: '' },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Call createCategory from mutations
      // const result = await createCategory({ translations: formData });
      // router.push('/admin/categories');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">New Category</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="en">
              <TabsList>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="tr">Türkçe</TabsTrigger>
              </TabsList>

              {(['en', 'tr'] as const).map((lang) => (
                <TabsContent key={lang} value={lang} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Category Name ({lang.toUpperCase()})
                    </label>
                    <Input
                      placeholder="e.g. Desserts"
                      value={formData[lang].name}
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
                      value={formData[lang].description}
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
                {loading ? 'Saving...' : 'Save Category'}
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
