import MenuEditor from "@/components/MenuEditor";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export default async function MenuEditorPage() {
  if (!supabaseAdmin) {
    return (
      <main className="min-h-screen bg-[#f2f0e9] px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center text-red-600">
            <p>Supabase yapılandırılmamış</p>
          </div>
        </div>
      </main>
    );
  }

  const { data: categories } = await supabaseAdmin
    .from("categories")
    .select("*, category_translations(language_code, name)")
    .order("id");

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("*, product_translations(language_code, name, description)")
    .order("id");

  return (
    <main className="min-h-screen bg-[#f2f0e9] px-4 py-16 text-gray-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-[#890333]/70">
            Admin
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[#890333]">
            Menü Düzenleyici
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">
            Supabase veri tabanında ürünleri düzenle. Resimleri yükle, adları,
            açıklamaları, fiyatları ve kategorileri değiştir.
          </p>
        </div>

        <MenuEditor categories={categories || []} products={products || []} />
      </div>
    </main>
  );
}
