import { getSessionWithTenant } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SettingsPage() {
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant || role !== 'owner') {
    redirect('/admin/dashboard');
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your restaurant information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Restaurant Name</label>
              <Input
                defaultValue={tenant.name}
                placeholder="e.g. Garage Chocolate"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <Input
                type="email"
                defaultValue={tenant.email || ''}
                placeholder="info@restaurant.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Phone</label>
              <Input
                defaultValue={tenant.phone || ''}
                placeholder="+90 555 123 4567"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Description</label>
              <Textarea
                defaultValue={tenant.description || ''}
                placeholder="Brief description of your restaurant..."
                rows={3}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Menu Slug</label>
              <Input
                value={tenant.slug}
                disabled
                className="bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Your public menu URL: /{tenant.slug}/en
              </p>
            </div>

            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Languages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tenant.languages?.map((lang: string) => (
              <div key={lang} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked id={lang} />
                <label htmlFor={lang} className="text-sm">
                  {lang === 'en' ? 'English' : 'Türkçe'}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Delete Restaurant</Button>
        </CardContent>
      </Card>
    </div>
  );
}
