/**
 * Every tenant needs the default order statuses before it can take or show
 * orders, but they were only ever seeded by one-off SQL for the first tenants.
 * A tenant created later (or whose addon was switched on later) had none, and
 * the order endpoint failed with "Order status configuration error".
 *
 * This seeds them on demand. The (tenant_id, key) unique constraint plus
 * ignoreDuplicates makes it safe to call concurrently or repeatedly, and it
 * never overwrites statuses the venue has customised.
 */
const DEFAULT_STATUSES = [
  { key: "awaiting_approval", label: "Onay Beklemede", color: "#FCD34D", sort_order: 1, is_terminal: false },
  { key: "preparing", label: "Hazırlanıyor", color: "#FB923C", sort_order: 2, is_terminal: false },
  { key: "completed", label: "Tamamlandı", color: "#10B981", sort_order: 3, is_terminal: true },
  { key: "cancelled", label: "İptal Edildi", color: "#EF4444", sort_order: 4, is_terminal: true },
] as const;

export async function ensureDefaultOrderStatuses(
  db: any,
  tenantId: number
): Promise<void> {
  const { error } = await db.from("order_statuses").upsert(
    DEFAULT_STATUSES.map((status) => ({
      ...status,
      tenant_id: tenantId,
      is_default_seed: true,
      is_enabled: true,
    })),
    { onConflict: "tenant_id,key", ignoreDuplicates: true }
  );
  if (error) {
    console.error("[ensureDefaultOrderStatuses] Failed:", error);
  }
}
