import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatPrice, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Key, CreditCard, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/orders")({ component: Orders });

function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[] | null>(null);
  
  useEffect(() => {
    if (!user) return;
    void supabase
      .from("orders")
      .select("*, order_items(*, products(title))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Your orders</h1>
      {orders === null ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border bg-card overflow-hidden">
              <div className="p-5 border-b flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-muted-foreground mb-1">#{o.id.slice(0, 8)}</div>
                  <div className="text-sm font-medium">{formatDate(o.created_at)}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize">{o.payment_status}</Badge>
                  <Badge variant={o.delivery_status === "delivered" ? "default" : "secondary"} className="capitalize">
                    {o.delivery_status}
                  </Badge>
                </div>
              </div>
              
              <div className="p-5">
                <div className="text-sm space-y-1">
                  {o.order_items.map((i: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-semibold">{i.products?.title}</span>
                      <span className="text-muted-foreground">{i.quantity} × {formatPrice(Number(i.price))}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground capitalize">
                    <CreditCard className="h-3.5 w-3.5" /> {o.payment_method || 'Manual'}
                  </div>
                  <div className="font-bold text-lg gradient-text">{formatPrice(Number(o.total_price))}</div>
                </div>
                {o.payment_status !== "paid" && (
                  <div className="mt-4 rounded-lg border bg-accent/40 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">Upload your eSewa payment screenshot in chat so admin can verify this order.</div>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/dashboard/chat" search={{ order: o.id } as any}><MessageCircle className="h-4 w-4 mr-1" />Upload proof</Link>
                    </Button>
                  </div>
                )}
              </div>

              {o.delivery_status === "delivered" && o.account_details && (
                <div className="bg-primary/5 p-5 border-t">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2">
                    <Key className="h-4 w-4" /> Account Details
                  </div>
                  <div className="font-mono text-sm bg-white p-3 rounded-lg border border-primary/20 break-all select-all">
                    {o.account_details}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Please change your password after logging in for the first time.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
