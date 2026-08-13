import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/db-retry";

/**
 * Shared query options for the checkout flow.
 *
 * The cart route's loader primes these so pricing, plan/terms data and the
 * cart lines are already in the TanStack Query cache by the time the page
 * renders (router preloads on link intent), instead of fetching in useEffect.
 */
export type CartLine = {
  id: string;
  quantity: number;
  product_id: string;
  products: {
    id: string;
    title: string;
    price: number;
    subscription_duration: string | null;
    image_url: string | null;
  };
};

export const cartQuery = queryOptions({
  queryKey: ["cart", "items"],
  queryFn: async (): Promise<CartLine[]> => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return [];
    const data = await withRetry(() =>
      supabase.from("cart_items").select("*, products(*)").eq("user_id", uid),
    );
    return ((data as CartLine[]) ?? []).filter((i) => i.products);
  },
  staleTime: 15_000,
  gcTime: 10 * 60_000,
  retry: 2,
  refetchOnWindowFocus: false,
});

export type SubscriptionPlan = {
  duration: string;
  minPrice: number;
  maxPrice: number;
  count: number;
};

/**
 * Subscription plans + price ranges, derived from active products so the
 * checkout screen can show pricing/terms without an extra round trip.
 */
export const plansQuery = queryOptions({
  queryKey: ["subscription-plans"],
  queryFn: async (): Promise<SubscriptionPlan[]> => {
    const data = await withRetry(() =>
      supabase.from("products").select("price, subscription_duration").eq("status", "active"),
    );
    const rows = (data as { price: number; subscription_duration: string | null }[]) ?? [];
    const map = new Map<string, SubscriptionPlan>();
    for (const r of rows) {
      const duration = r.subscription_duration?.trim() || "Custom";
      const price = Number(r.price);
      const cur = map.get(duration);
      if (!cur) map.set(duration, { duration, minPrice: price, maxPrice: price, count: 1 });
      else {
        cur.minPrice = Math.min(cur.minPrice, price);
        cur.maxPrice = Math.max(cur.maxPrice, price);
        cur.count += 1;
      }
    }
    return [...map.values()].sort((a, b) => a.minPrice - b.minPrice);
  },
  staleTime: 30 * 60_000,
  gcTime: 60 * 60_000,
  retry: 2,
  refetchOnWindowFocus: false,
});

export type OrderRow = {
  id: string;
  created_at: string;
  total_price: number;
  payment_status: string;
  delivery_status: string;
  payment_method: string | null;
  account_details: string | null;
  order_items: { quantity: number; price: number; products: { title: string } | null }[];
};

/**
 * Order history for the signed-in user. Shared so checkout can invalidate it
 * the moment an order is placed / payment succeeds.
 */
export const ordersQuery = queryOptions({
  queryKey: ["orders", "mine"],
  queryFn: async (): Promise<OrderRow[]> => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return [];
    const data = await withRetry(() =>
      supabase
        .from("orders")
        .select("*, order_items(*, products(title))")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
    );
    return (data as OrderRow[]) ?? [];
  },
  staleTime: 10_000,
  gcTime: 10 * 60_000,
  retry: 2,
  refetchOnWindowFocus: false,
});