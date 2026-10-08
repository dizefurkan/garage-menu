/**
 * Sub-category rules (one level only), checked before writing so the admin
 * gets a specific error instead of the generic trigger exception.
 */
export type ParentError =
  | "PARENT_NOT_FOUND"
  | "PARENT_IS_SELF"
  | "PARENT_IS_CHILD"
  | "CATEGORY_HAS_CHILDREN";

export async function validateCategoryParent(
  db: any,
  tenantId: number,
  categoryId: number | null,
  parentId: number
): Promise<ParentError | null> {
  if (categoryId !== null && parentId === categoryId) return "PARENT_IS_SELF";

  const { data: parent } = await db
    .from("categories")
    .select("id, parent_id")
    .eq("id", parentId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!parent) return "PARENT_NOT_FOUND";
  if (parent.parent_id !== null) return "PARENT_IS_CHILD";

  if (categoryId !== null) {
    const { count } = await db
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", categoryId);
    if (count && count > 0) return "CATEGORY_HAS_CHILDREN";
  }

  return null;
}

/** Normalises the request value: ""/null/undefined -> null, else a number. */
export function parseParentId(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "" || value === "none") return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}
