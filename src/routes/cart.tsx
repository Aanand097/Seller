import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, ShoppingBag, CreditCard, Receipt } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { placeOrder } from "@/lib/orders.functions";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — NexusAI" }] }),
  component: CartPage,
});

function CartPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<any[] | null>(null);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("esewa");
  const [paymentProof, setPaymentProof] = useState("");
  const placeOrderFn = useServerFn(placeOrder);

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
    if (!user || !items?.length || placing) return;
    if (!paymentProof) {
      toast.error("Please provide payment proof (Transaction ID or Screenshot URL)");
      return;
    }
    setPlacing(true);
    try {
      await placeOrderFn({ data: { paymentMethod, paymentProof } });
      toast.success("Order placed! We will verify your payment.");
      nav({ to: "/dashboard/orders" });
    } catch (e: any) {
      toast.error(e?.message ?? "Order failed");
    } finally {
      setPlacing(false);
    }
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
          <div className="grid md:grid-cols-[1fr_350px] gap-6">
            <div className="space-y-6">
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

              <div className="rounded-2xl border bg-card p-6">
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Method</h3>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="esewa" id="esewa" className="peer sr-only" />
                    <Label htmlFor="esewa" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      <span className="font-semibold">eSewa</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="manual" id="manual" className="peer sr-only" />
                    <Label htmlFor="manual" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      <span className="font-semibold">Manual / Bank</span>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="mt-6 space-y-4">
                  <div className="p-4 rounded-xl bg-accent/50 text-sm">
                    <p className="font-bold mb-1">Payment Instructions:</p>
                    <p>eSewa ID: 98XXXXXXXX (Name: NexusAI)</p>
                    <p className="mt-2 text-muted-foreground">After payment, please enter the Transaction ID or upload a screenshot and paste the link below.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proof">Payment Proof (Txn ID or Link)</Label>
                    <Input id="proof" placeholder="e.g. 52XJ8..." value={paymentProof} onChange={(e) => setPaymentProof(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl glass p-6 h-fit sticky top-24">
              <h3 className="font-display font-bold text-lg mb-4">Summary</h3>
              <div className="flex justify-between mb-2"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
              <div className="flex justify-between mb-4 text-sm text-muted-foreground"><span>Tax</span><span>Included</span></div>
              <div className="flex justify-between font-bold text-lg pt-4 border-t"><span>Total</span><span className="gradient-text">{formatPrice(total)}</span></div>
              <Button onClick={checkout} disabled={placing} size="lg" className="w-full mt-6 text-white" style={{ background: "var(--gradient-primary)" }}>{placing ? "Placing order..." : "Checkout"}</Button>
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
