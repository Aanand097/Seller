import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/db-retry";

export type SiteSettings = {
  id: boolean;
  site_name: string;
  whatsapp_number: string;
  contact_email: string;
  esewa_account_name: string;
  esewa_account_id: string;
  tax_percent: number;
  support_note: string | null;
};

export type Plan = {
  id: string;
  name: string;
  duration: string;
  price: number;
  description: string | null;
  sort_order: number;
  active: boolean;
};

export const settingsQuery = queryOptions({
  queryKey: ["site-settings"],
  queryFn: async (): Promise<SiteSettings | null> => {
    const data = await withRetry(() =>
      (supabase.from("site_settings" as any).select("*").limit(1).maybeSingle() as any),
    );
    return (data as SiteSettings) ?? null;
  },
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
  retry: 2,
  refetchOnWindowFocus: false,
});

export const catalogPlansQuery = queryOptions({
  queryKey: ["plans", "catalog"],
  queryFn: async (): Promise<Plan[]> => {
    const data = await withRetry(() =>
      (supabase.from("plans" as any).select("*").order("sort_order").order("price") as any),
    );
    return ((data as Plan[]) ?? []).filter((p) => p.active);
  },
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
  retry: 2,
  refetchOnWindowFocus: false,
});

export const adminPlansQuery = queryOptions({
  queryKey: ["plans", "admin"],
  queryFn: async (): Promise<Plan[]> => {
    const { data, error } = await (supabase.from("plans" as any).select("*").order("sort_order").order("price") as any);
    if (error) throw new Error(error.message);
    return (data as Plan[]) ?? [];
  },
  staleTime: 30_000,
  refetchOnWindowFocus: false,
});
