import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, ShoppingCart, MessageCircle, Check, ArrowLeft } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState<any>(null);

  useEffect(() => {
    void supabase.from("products").select("*, categories(name)").eq("id", id).maybeSingle().then(({ data }) => setP(data));
  }, [id]);

  const buy = async () => {
    if (!user) return navigate({ to: "/login" });
    await supabase.from("cart_items").upsert({ user_id: user.id, product_id: id, quantity: 1 }, { onConflict: "user_id,product_id" });
    navigate({ to: "/cart" });
  };
  const addToCart = async () => {
    if (!user) return navigate({ to: "/login" });
    const { error } = await supabase.from("cart_items").upsert({ user_id: user.id, product_id: id, quantity: 1 }, { onConflict: "user_id,product_id" });
    if (error) toast.error(error.message);
    else toast.success("Added to cart");
  };

  return (
    <PublicLayout>
      <section className="container mx-auto max-w-6xl px-4 py-12">
        <Link to="/products" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6"><ArrowLeft className="h-4 w-4" /> Back to products</Link>
        {!p ? (
          <div className="grid md:grid-cols-2 gap-10">
            <Skeleton className="aspect-[4/3] rounded-2xl" />
            <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-6" /><Skeleton className="h-24" /></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border bg-gradient-to-br from-accent to-white grid place-items-center">
              {p.image_url ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" /> : (
                <div className="h-28 w-28 rounded-2xl grid place-items-center text-white" style={{ background: "var(--gradient-primary)" }}><Sparkles className="h-14 w-14" /></div>
              )}
            </div>
            <div>
              {p.categories?.name && <Badge variant="secondary" className="mb-3">{p.categories.name}</Badge>}
              <h1 className="font-display text-4xl font-bold">{p.title}</h1>
              <p className="text-muted-foreground mt-3">{p.description}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <div className="text-4xl font-bold gradient-text">{formatPrice(Number(p.price))}</div>
                <div className="text-muted-foreground">/ {p.subscription_duration ?? "subscription"}</div>
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                {["Instant activation", "Verified premium account", "24/7 chat support", "Full subscription duration"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={buy} size="lg" className="text-white" style={{ background: "var(--gradient-primary)" }}>Buy now</Button>
                <Button onClick={addToCart} size="lg" variant="outline"><ShoppingCart className="h-4 w-4 mr-2" />Add to cart</Button>
                <Button onClick={() => navigate({ to: "/dashboard/chat" })} size="lg" variant="ghost"><MessageCircle className="h-4 w-4 mr-2" />Chat</Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}