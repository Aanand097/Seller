import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, ShoppingBag } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — NexusAI" }] }),
  component: CartPage,
});

function CartPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<any[] | null>(null);

  const load = async () => {
    if (!user) return setItems([]);
    const { data } = await supabase.from("cart_items").select("*, products(*)").eq("user_id", user.id);
    setItems(data ?? []);
  };
  useEffect(() => { if (!loading) void load(); }, [user, loading]);

  const remove = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    void load();
  };

  const checkout = async () => {
    if (!user || !items?.length) return;
    const total = items.reduce((s, i) => s + Number(i.products.price) * i.quantity, 0);
    const { data: order, error } = await supabase.from("orders").insert({ user_id: user.id, total_price: total, payment_status: "paid", delivery_status: "delivered" }).select().single();
    if (error || !order) return toast.error(error?.message ?? "Order failed");
    await supabase.from("order_items").insert(items.map((i) => ({ order_id: order.id, product_id: i.product_id, price: i.products.price, quantity: i.quantity })));
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    await supabase.from("notifications").insert({ user_id: user.id, title: "Order confirmed", message: `Your order #${order.id.slice(0,8)} has been placed successfully.` });
    toast.success("Order placed!");
    nav({ to: "/dashboard/orders" });
  };

  if (!loading && !user) return <PublicLayout><div className="container mx-auto max-w-md px-4 py-20 text-center"><h1 className="text-2xl font-bold">Sign in to view your cart</h1><Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button></div></PublicLayout>;

  const total = (items ?? []).reduce((s, i) => s + Number(i.products.price) * i.quantity, 0);

  return (
    <PublicLayout>
      <section className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="font-display text-4xl font-bold mb-8">Your cart</h1>
        {items === null ? <div>Loading...</div> : items.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Your cart is empty</p>
            <Button asChild className="mt-6"><Link to="/products">Browse products</Link></Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.id} className="rounded-xl border bg-card p-4 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-accent grid place-items-center text-primary font-bold">{i.products.title[0]}</div>
                  <div className="flex-1">
                    <div className="font-semibold">{i.products.title}</div>
                    <div className="text-sm text-muted-foreground">{i.products.subscription_duration}</div>
                  </div>
                  <div className="font-semibold">{formatPrice(Number(i.products.price))}</div>
                  <Button size="icon" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <div className="rounded-2xl glass p-6 h-fit">
              <h3 className="font-display font-bold text-lg mb-4">Summary</h3>
              <div className="flex justify-between mb-2"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
              <div className="flex justify-between mb-4 text-sm text-muted-foreground"><span>Tax</span><span>Included</span></div>
              <div className="flex justify-between font-bold text-lg pt-4 border-t"><span>Total</span><span className="gradient-text">{formatPrice(total)}</span></div>
              <Button onClick={checkout} size="lg" className="w-full mt-6 text-white" style={{ background: "var(--gradient-primary)" }}>Checkout</Button>
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}