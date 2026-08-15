import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/db-retry";
import type { ProductRow } from "@/components/site/ProductCard";

/**
 * Shared TanStack Query options for product data.
 *
 * Everything uses stale-while-revalidate: cached rows render instantly and
 * only refetch in the background once stale, so navigating between the list,
 * the home page and a detail page never re-downloads the same data.
 */
const SHARED = {
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
  retry: 2,
  retryDelay: (a: number) => Math.min(1000 * 2 ** a, 5000),
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
} as const;

// Explicit column list keeps the payload small (no unused blobs over the wire).
const LIST_COLS = "id,title,description,image_url,price,subscription_duration,featured,category_id,categories(id,name)";

export const productsQuery = queryOptions({
  queryKey: ["products", "active"],
  queryFn: async () => {
    const data = await withRetry(() =>
      supabase.from("products").select(LIST_COLS).eq("status", "active").order("featured", { ascending: false }),
    );
    return (data as ProductRow[]) ?? [];
  },
  ...SHARED,
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const data = await withRetry(() => supabase.from("categories").select("id,name,icon"));
    return (data as { id: string; name: string; icon: string | null }[]) ?? [];
  },
  ...SHARED,
  staleTime: 30 * 60_000,
  gcTime: 60 * 60_000,
});

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: async () => {
      const data = await withRetry(() =>
        supabase.from("products").select("*, categories(id,name)").eq("id", id).maybeSingle(),
      );
      return data as (ProductRow & { categories?: { id: string; name: string } | null }) | null;
    },
    ...SHARED,
  });

export const relatedQuery = (categoryId: string | null, excludeId: string) =>
  queryOptions({
    queryKey: ["products", "related", categoryId, excludeId],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select(LIST_COLS)
        .eq("status", "active")
        .neq("id", excludeId)
        .limit(4);
      if (categoryId) q = q.eq("category_id", categoryId);
      const data = await withRetry(() => q);
      return (data as ProductRow[]) ?? [];
    },
    ...SHARED,
  });
