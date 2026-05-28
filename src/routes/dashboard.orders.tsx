import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatPrice, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/orders")({ component: Orders });

function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[] | null>(null);
  useEffect(() => {
    if (!user) return;
    void supabase.from("orders").select("*, order_items(*, products(title))").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setOrders(data ?? []));
  }, [user]);
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Your orders</h1>
      {orders === null ? "Loading..." : orders.length === 0 ? <p className="text-muted-foreground">No orders yet.</p> : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="font-mono text-sm text-muted-foreground">#{o.id.slice(0, 8)}</div>
                <Badge variant={o.delivery_status === "delivered" ? "default" : "secondary"}>{o.delivery_status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{formatDate(o.created_at)}</div>
              <div className="mt-2 text-sm">{o.order_items.map((i: any) => i.products.title).join(", ")}</div>
              <div className="mt-3 font-bold gradient-text">{formatPrice(Number(o.total_price))}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}