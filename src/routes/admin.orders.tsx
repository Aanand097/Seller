import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { updateOrderStatus } from "@/lib/admin-orders.functions";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

const STATUSES = ["pending", "processing", "delivered", "cancelled", "archived", "scam_review"];

function AdminOrders() {
  const [list, setList] = useState<any[]>([]);
  const updateStatus = useServerFn(updateOrderStatus);
  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, profiles(full_name, email), order_items(quantity, price, products(title))")
      .order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { void load(); }, []);
  const update = async (orderId: string, status: string) => {
    try {
      await updateStatus({ data: { orderId, status } });
      toast.success("Order updated & user notified");
      void load();
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    }
  };
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Orders</h1>
      {list.length === 0 && <p className="text-muted-foreground">No orders yet.</p>}
      <div className="rounded-2xl border bg-card divide-y">
        {list.map((o) => (
          <div key={o.id} className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center">
            <div className="min-w-0">
              <div className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</div>
              <div className="font-semibold truncate">{o.profiles?.full_name ?? o.profiles?.email ?? "User"}</div>
              <div className="text-xs text-muted-foreground">{formatDate(o.created_at)}</div>
              {Array.isArray(o.order_items) && o.order_items.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground truncate">
                  {o.order_items.map((i: any) => `${i.products?.title ?? "Product"} ×${i.quantity}`).join(", ")}
                </div>
              )}
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