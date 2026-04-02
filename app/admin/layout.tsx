import { redirect } from 'next/navigation';
import { getSessionWithTenant } from '@/lib/auth/session';
import { logout } from '@/lib/auth/logout';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Categories', href: '/admin/categories' },
  { label: 'Team', href: '/admin/team' },
  { label: 'Settings', href: '/admin/settings' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant) {
    redirect('/auth/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-900 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <p className="mt-2 text-sm text-gray-400 capitalize">Role: {role}</p>
        </div>

        <nav className="space-y-0 border-t border-gray-800">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block border-l-4 border-transparent px-6 py-3 hover:border-blue-500 hover:bg-gray-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="border-b bg-white">
          <div className="flex items-center justify-between px-8 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Admin Dashboard</h2>

            <div className="flex items-center gap-4">
              {/* Public Link */}
              <a
                href={`/${tenant.slug}/en`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View Public Menu →
              </a>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    {user.email}
                  </DropdownMenuItem>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="w-full px-2 py-1.5 text-left text-sm"
                    >
                      Sign Out
                    </button>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="bg-gray-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
