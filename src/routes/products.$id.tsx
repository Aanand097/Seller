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
import { buildWhatsAppUrl } from "@/lib/site-config";
import { addProductToCart } from "@/lib/cart";

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
    try {
      await addProductToCart(user.id, id);
    } catch (error: any) {
      toast.error(error?.message ?? "Could not add to cart");
      return;
    }
    navigate({ to: "/cart" });
  };
  const addToCart = async () => {
    if (!user) return navigate({ to: "/login" });
    try {
      await addProductToCart(user.id, id);
      toast.success("Added to cart");
    } catch (error: any) {
      toast.error(error?.message ?? "Could not add to cart");
    }
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
                <Button onClick={() => navigate({ to: "/dashboard/chat", search: { product: id } as any })} size="lg" variant="ghost"><MessageCircle className="h-4 w-4 mr-2" />Chat about this</Button>
                <a
                  href={buildWhatsAppUrl(`Hi! I'm interested in "${p.title}" (${formatPrice(Number(p.price))}). Can you tell me more?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-[#25D366] text-white font-medium hover:opacity-90"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.555-5.338 11.89-11.893 11.89a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}