import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    slug: string;
    tableId: string;
  }>;
}

export default async function OrderRedirectPage({ params }: Props) {
  const { slug, tableId } = await params;
  // Redirect to menu page with tableId query parameter
  redirect(`/menu/${slug}/tr?tableId=${tableId}`);
}
