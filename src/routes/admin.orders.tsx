import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

const STATUSES = ["pending", "processing", "delivered", "cancelled", "archived", "scam_review"];

function AdminOrders() {
  const [list, setList] = useState<any[]>([]);
  const load = async () => { const { data } = await supabase.from("orders").select("*, profiles(full_name, email)").order("created_at", { ascending: false }); setList(data ?? []); };
  useEffect(() => { void load(); }, []);
  const update = async (id: string, delivery_status: string) => {
    const { error } = await supabase.from("orders").update({ delivery_status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); void load(); }
  };
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Orders</h1>
      <div className="rounded-2xl border bg-card divide-y">
        {list.map((o) => (
          <div key={o.id} className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center">
            <div>
              <div className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</div>
              <div className="font-semibold">{o.profiles?.full_name ?? o.profiles?.email ?? "User"}</div>
              <div className="text-xs text-muted-foreground">{formatDate(o.created_at)}</div>
            </div>
            <div className="font-bold">{formatPrice(Number(o.total_price))}</div>
            <select value={o.delivery_status} onChange={(e) => update(o.id, e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}