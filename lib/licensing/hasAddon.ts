import { Database } from '@/lib/database.types';

export type TenantRow = Database['public']['Tables']['tenants']['Row'];
export type TenantAddonRow = Database['public']['Tables']['tenant_addons']['Row'];

/**
 * Checks if a tenant has an addon enabled.
 * Used server-side to gate API routes and pages for addon-dependent features.
 */
export async function hasAddon(
  tenant: TenantRow | null,
  addonKey: string,
  supabaseAdmin?: any
): Promise<boolean> {
  if (!tenant) {
    return false;
  }

  // If supabaseAdmin is provided, fetch fresh data from DB
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('tenant_addons')
        .select('enabled, expires_at')
        .eq('tenant_id', tenant.id)
        .eq('addon_key', addonKey)
        .single();

      if (error || !data) {
        return false;
      }

      // Check if addon is enabled
      if (!data.enabled) {
        return false;
      }

      // Check if addon has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return false;
      }

      return true;
    } catch (err) {
      console.error(`[hasAddon] Error checking addon "${addonKey}":`, err);
      return false;
    }
  }

  // Fallback: return false if no supabase client provided
  return false;
}

/**
 * Guard middleware for API routes to check addon access.
 * Usage:
 *   const allowed = await guardAddonAccess(req, 'orders_management', supabaseAdmin);
 *   if (!allowed) return new Response('Forbidden', { status: 403 });
 */
export async function guardAddonAccess(
  tenant: TenantRow | null,
  addonKey: string,
  supabaseAdmin?: any
): Promise<boolean> {
  return hasAddon(tenant, addonKey, supabaseAdmin);
}
