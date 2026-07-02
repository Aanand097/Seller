import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { updateOrderStatus } from "@/lib/admin-orders.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, CreditCard, User, Package } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

const STATUSES = ["pending", "processing", "delivered", "cancelled", "archived", "scam_review"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

function AdminOrders() {
  const [list, setList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [accountDetails, setAccountDetails] = useState("");
  const updateStatus = useServerFn(updateOrderStatus);

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, profiles(full_name, email), order_items(quantity, price, products(title))")
      .order("created_at", { ascending: false });
    setList(data ?? []);
  };
  
  useEffect(() => { void load(); }, []);

  const update = async (orderId: string, status: string, paymentStatus?: string, details?: string) => {
    try {
      await updateStatus({ data: { orderId, status, paymentStatus, accountDetails: details } });
      toast.success("Order updated");
      setEditingId(null);
      void load();
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Manage Orders</h1>
      {list.length === 0 && <p className="text-muted-foreground">No orders yet.</p>}
      
      <div className="space-y-4">
        {list.map((o) => (
          <div key={o.id} className="rounded-2xl border bg-card overflow-hidden">
            <div className="p-6 border-b bg-accent/5 flex flex-wrap justify-between items-center gap-4">
              <div>
                <div className="font-mono text-xs text-muted-foreground">ID: {o.id}</div>
                <div className="text-sm font-medium mt-1">{formatDate(o.created_at)}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right mr-4">
                  <div className="text-xs text-muted-foreground">Total Price</div>
                  <div className="font-bold text-lg">{formatPrice(Number(o.total_price))}</div>
                </div>
                <div className="space-y-2">
                   <select 
                    value={o.payment_status} 
                    onChange={(e) => update(o.id, o.delivery_status, e.target.value)}
                    className="block w-full h-8 rounded-md border bg-background px-2 text-xs font-semibold uppercase"
                  >
                    {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select 
                    value={o.delivery_status} 
                    onChange={(e) => update(o.id, e.target.value, o.payment_status)}
                    className="block w-full h-8 rounded-md border bg-background px-2 text-xs font-semibold uppercase"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 grid md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" /> Customer
                </h4>
                <div className="font-semibold">{o.profiles?.full_name ?? "No Name"}</div>
                <div className="text-sm text-muted-foreground">{o.profiles?.email}</div>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment Info
                </h4>
                <div className="text-sm">Method: <span className="font-semibold capitalize">{o.payment_method || "N/A"}</span></div>
                <div className="text-sm mt-1">
                  Proof: {o.payment_proof ? (
                    <a href={o.payment_proof.startsWith('http') ? o.payment_proof : '#'} target="_blank" className="text-primary hover:underline inline-flex items-center gap-1">
                      {o.payment_proof.slice(0, 20)}... <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : "None"}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Order Items
                </h4>
                <div className="text-sm space-y-1">
                  {o.order_items?.map((i: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>{i.products?.title} ×{i.quantity}</span>
                      <span className="text-muted-foreground">{formatPrice(Number(i.price))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-accent/5 border-t">
              <h4 className="text-sm font-bold mb-3">Delivery Account Details</h4>
              {editingId === o.id ? (
                <div className="flex gap-2">
                  <Input 
                    value={accountDetails} 
                    onChange={(e) => setAccountDetails(e.target.value)} 
                    placeholder="Enter account credentials (email:pass)..."
                    className="flex-1"
                  />
                  <Button onClick={() => update(o.id, "delivered", "paid", accountDetails)}>Deliver & Notify</Button>
                  <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="text-sm font-mono bg-background p-2 rounded border flex-1 mr-4 min-h-[40px]">
                    {o.account_details || <span className="text-muted-foreground italic">No details provided yet</span>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingId(o.id);
                    setAccountDetails(o.account_details || "");
                  }}>Edit Details</Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
