'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSessionWithTenant } from '@/lib/auth/session';
import { nanoid } from 'nanoid';

export async function createProduct(input: {
  category_id: number;
  price: number;
  currency: string;
  translations: Record<string, { name: string; description?: string; slug?: string }>;
}) {
  const { user, tenant } = await getSessionWithTenant();
  if (!user || !tenant) throw new Error('Unauthorized');

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  // Create product
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      tenant_id: tenant.id,
      category_id: input.category_id,
      price: input.price,
      currency: input.currency,
      is_draft: true,
      display_order: 0,
      is_available: true,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (productError) throw new Error(productError.message);

  // Add translations
  const translations = Object.entries(input.translations).map(([lang, data]) => ({
    product_id: product.id,
    language_code: lang,
    name: data.name,
    description: data.description,
    slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
  }));

  const { error: transError } = await supabase
    .from('product_translations')
    .insert(translations);

  if (transError) throw new Error(transError.message);

  return product;
}

export async function updateProduct(
  id: number,
  input: {
    category_id?: number;
    price?: number;
    currency?: string;
    is_available?: boolean;
    translations?: Record<string, { name: string; description?: string }>;
  }
) {
  const { user, tenant } = await getSessionWithTenant();
  if (!user || !tenant) throw new Error('Unauthorized');

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  // Update product
  const updateData: any = {
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  if (input.category_id !== undefined) updateData.category_id = input.category_id;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.is_available !== undefined) updateData.is_available = input.is_available;

  const { error: updateError } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', tenant.id);

  if (updateError) throw new Error(updateError.message);

  // Update translations if provided
  if (input.translations) {
    for (const [lang, data] of Object.entries(input.translations)) {
      await supabase
        .from('product_translations')
        .update({
          name: data.name,
          description: data.description,
          updated_at: new Date().toISOString(),
        })
        .eq('product_id', id)
        .eq('language_code', lang);
    }
  }
}

export async function publishProduct(id: number) {
  const { user, tenant } = await getSessionWithTenant();
  if (!user || !tenant) throw new Error('Unauthorized');

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { error } = await supabase
    .from('products')
    .update({
      is_draft: false,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', tenant.id);

  if (error) throw new Error(error.message);
}

export async function deleteProduct(id: number) {
  const { user, tenant } = await getSessionWithTenant();
  if (!user || !tenant) throw new Error('Unauthorized');

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenant.id);

  if (error) throw new Error(error.message);
}

// CATEGORY ACTIONS
export async function createCategory(input: {
  translations: Record<string, { name: string; description?: string }>;
}) {
  const { user, tenant } = await getSessionWithTenant();
  if (!user || !tenant) throw new Error('Unauthorized');

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: category, error: catError } = await supabase
    .from('categories')
    .insert({
      tenant_id: tenant.id,
      is_draft: true,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (catError) throw new Error(catError.message);

  // Add translations
  const translations = Object.entries(input.translations).map(([lang, data]) => ({
    category_id: category.id,
    language_code: lang,
    name: data.name,
    description: data.description,
    slug: data.name.toLowerCase().replace(/\s+/g, '-'),
  }));

  const { error: transError } = await supabase
    .from('category_translations')
    .insert(translations);

  if (transError) throw new Error(transError.message);

  return category;
}

export async function deleteCategory(id: number) {
  const { user, tenant } = await getSessionWithTenant();
  if (!user || !tenant) throw new Error('Unauthorized');

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenant.id);

  if (error) throw new Error(error.message);
}
