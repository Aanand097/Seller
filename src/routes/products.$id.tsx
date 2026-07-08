import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Sparkles, ShoppingCart, MessageCircle, Check, ChevronRight,
  Zap, ShieldCheck, Clock, Headphones, Share2, Heart, Star,
  Truck, RefreshCw, BadgeCheck, CreditCard,
} from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard, type ProductRow } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { buildWhatsAppUrl } from "@/lib/site-config";
import { addProductToCart } from "@/lib/cart";

const productQuery = (id: string) => queryOptions({
  queryKey: ["product", id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(id,name)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
});

const relatedQuery = (categoryId: string | null, excludeId: string) => queryOptions({
  queryKey: ["products", "related", categoryId, excludeId],
  queryFn: async () => {
    let q = supabase.from("products").select("*, categories(name)").eq("status", "active").neq("id", excludeId).limit(4);
    if (categoryId) q = q.eq("category_id", categoryId);
    const { data } = await q;
    return (data as ProductRow[]) ?? [];
  },
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/products/$id")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.id));
    if (!p) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Product — NextGen E-Learning" },
      { name: "description", content: "Get premium access instantly with verified accounts and 24/7 support." },
    ],
  }),
  pendingComponent: () => (
    <PublicLayout>
      <section className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_1fr_320px] gap-6">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4"><Skeleton className="h-8" /><Skeleton className="h-6" /><Skeleton className="h-24" /></div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </section>
    </PublicLayout>
  ),
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Couldn't load product</h1>
        <p className="text-muted-foreground mt-2">{error.message}</p>
        <Link to="/products" className="text-primary underline mt-4 inline-block">Back to products</Link>
      </div>
    </PublicLayout>
  ),
  notFoundComponent: () => (
    <PublicLayout>
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Product not found</h1>
        <Link to="/products" className="text-primary underline mt-4 inline-block">Browse all products</Link>
      </div>
    </PublicLayout>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: p } = useSuspenseQuery(productQuery(id));
  const { data: related = [] } = useQuery(relatedQuery(p?.category_id ?? null, id));
  const [tab, setTab] = useState<"desc" | "features" | "howto">("desc");
  const [qty, setQty] = useState(1);

  if (!p) return null;

  const priceLabel = formatPrice(Number(p.price));
  const compareAt = Number(p.price) * 1.25;
  const duration = p.subscription_duration ?? "subscription";

  const buy = async () => {
    if (!user) return navigate({ to: "/login" });
    try {
      for (let i = 0; i < qty; i++) await addProductToCart(user.id, id);
    } catch (e: any) { toast.error(e?.message ?? "Could not add to cart"); return; }
    navigate({ to: "/cart" });
  };
  const addToCart = async () => {
    if (!user) return navigate({ to: "/login" });
    try {
      for (let i = 0; i < qty; i++) await addProductToCart(user.id, id);
      toast.success(`${qty} added to cart`);
    } catch (e: any) { toast.error(e?.message ?? "Could not add to cart"); }
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: p.title, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }
    } catch {}
  };

  return (
    <PublicLayout>
      {/* Breadcrumbs */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-3 text-sm text-muted-foreground flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/products" className="hover:text-primary">Products</Link>
          {p.categories?.name && (<>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="hover:text-primary">{p.categories.name}</span>
          </>)}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground truncate max-w-[40ch]">{p.title}</span>
        </div>
      </div>

      <section className="container mx-auto max-w-7xl px-4 py-6">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_320px] gap-6">
          {/* Gallery */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden border bg-gradient-to-br from-accent/40 to-white grid place-items-center sticky top-24">
              {p.image_url ? (
                <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" loading="eager" />
              ) : (
                <div className="h-32 w-32 rounded-2xl grid place-items-center text-white" style={{ background: "var(--gradient-primary)" }}>
                  <Sparkles className="h-16 w-16" />
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <button key={i} className={`h-16 w-16 rounded-lg border-2 overflow-hidden bg-muted/50 ${i === 0 ? "border-primary" : "border-transparent"}`}>
                  {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-muted-foreground"><Sparkles className="h-6 w-6" /></div>}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {p.featured && <Badge className="text-white border-0" style={{ background: "var(--gradient-primary)" }}>★ Featured</Badge>}
              {p.categories?.name && <Badge variant="secondary">{p.categories.name}</Badge>}
              <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">In stock</Badge>
            </div>

            <h1 className="font-display text-2xl md:text-3xl font-bold leading-snug">{p.title}</h1>

            <div className="flex items-center gap-3 mt-2 text-sm">
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <span className="text-muted-foreground">4.9 (128 reviews)</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">500+ sold</span>
              <button onClick={share} className="ml-auto text-muted-foreground hover:text-primary" aria-label="Share"><Share2 className="h-4 w-4" /></button>
              <button className="text-muted-foreground hover:text-primary" aria-label="Wishlist"><Heart className="h-4 w-4" /></button>
            </div>

            {/* Price block */}
            <div className="mt-5 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/40 border p-5">
              <div className="flex items-baseline gap-3 flex-wrap">
                <div className="text-4xl font-bold gradient-text">{priceLabel}</div>
                <div className="text-lg text-muted-foreground line-through">{formatPrice(compareAt)}</div>
                <Badge className="bg-red-500 text-white border-0">-20%</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">per {duration} · price includes taxes</div>
            </div>

            {/* Duration option */}
            <div className="mt-5">
              <div className="text-sm font-medium mb-2">Plan</div>
              <button className="rounded-xl border-2 border-primary bg-primary/5 px-4 py-3 text-left">
                <div className="text-sm font-semibold">{duration}</div>
                <div className="text-xs text-muted-foreground">Full access · Instant delivery</div>
              </button>
            </div>

            {/* Quantity + actions */}
            <div className="mt-5">
              <div className="text-sm font-medium mb-2">Quantity</div>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border rounded-lg overflow-hidden">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-10 w-10 hover:bg-muted">−</button>
                  <div className="w-12 text-center font-medium">{qty}</div>
                  <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="h-10 w-10 hover:bg-muted">+</button>
                </div>
                <span className="text-sm text-muted-foreground">Max 10 per order</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={buy} size="lg" className="text-white flex-1 min-w-[160px]" style={{ background: "var(--gradient-primary)" }}>Buy now</Button>
              <Button onClick={addToCart} size="lg" variant="outline" className="flex-1 min-w-[160px]"><ShoppingCart className="h-4 w-4 mr-2" />Add to cart</Button>
              <a
                href={buildWhatsAppUrl(`Hi! I'm interested in "${p.title}" (${priceLabel}). Can you tell me more?`)}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-[#25D366] text-white font-medium hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.555-5.338 11.89-11.893 11.89a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                WhatsApp
              </a>
            </div>

            <button
              onClick={() => navigate({ to: "/dashboard/chat", search: { product: id } as any })}
              className="mt-3 text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Chat with us about this product
            </button>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl border bg-card p-5">
              <div className="font-semibold mb-3">Delivery & Support</div>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3"><Truck className="h-5 w-5 text-primary shrink-0" /><div><div className="font-medium">Instant Digital Delivery</div><div className="text-muted-foreground text-xs">Access within 15 minutes of payment</div></div></div>
                <div className="flex gap-3"><CreditCard className="h-5 w-5 text-primary shrink-0" /><div><div className="font-medium">eSewa / QR Payment</div><div className="text-muted-foreground text-xs">Scan, pay, upload proof</div></div></div>
                <div className="flex gap-3"><Headphones className="h-5 w-5 text-primary shrink-0" /><div><div className="font-medium">24/7 Support</div><div className="text-muted-foreground text-xs">WhatsApp & in-app chat</div></div></div>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <div className="font-semibold mb-3">Warranty</div>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3"><BadgeCheck className="h-5 w-5 text-emerald-600 shrink-0" /><div><div className="font-medium">100% genuine</div><div className="text-muted-foreground text-xs">Verified premium account</div></div></div>
                <div className="flex gap-3"><RefreshCw className="h-5 w-5 text-emerald-600 shrink-0" /><div><div className="font-medium">Free replacement</div><div className="text-muted-foreground text-xs">If it stops working during duration</div></div></div>
                <div className="flex gap-3"><ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" /><div><div className="font-medium">Secure checkout</div><div className="text-muted-foreground text-xs">Your data stays private</div></div></div>
              </div>
            </div>
          </aside>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="border-b flex gap-1 overflow-x-auto">
            {[
              { k: "desc", label: "Description" },
              { k: "features", label: "What you get" },
              { k: "howto", label: "How to buy" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as any)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${tab === t.k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="py-6">
            {tab === "desc" && (
              <div className="prose max-w-none text-muted-foreground leading-relaxed">
                <p>{p.description || `${p.title} gives you full premium access for the entire ${duration}. Delivered instantly after payment confirmation with dedicated support from the NextGen E-Learning team.`}</p>
              </div>
            )}
            {tab === "features" && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Zap, title: "Instant activation", desc: "Access within minutes of confirmation." },
                  { icon: ShieldCheck, title: "100% genuine", desc: "Verified premium account." },
                  { icon: Clock, title: `Full ${duration}`, desc: "Uninterrupted for the whole duration." },
                  { icon: Headphones, title: "24/7 support", desc: "WhatsApp & in-app chat, anytime." },
                ].map((f) => (
                  <div key={f.title} className="rounded-2xl border bg-card p-5">
                    <div className="h-10 w-10 rounded-xl grid place-items-center text-white mb-3" style={{ background: "var(--gradient-primary)" }}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div className="font-semibold">{f.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{f.desc}</div>
                  </div>
                ))}
              </div>
            )}
            {tab === "howto" && (
              <ol className="space-y-4">
                {[
                  "Add this product to your cart and go to checkout.",
                  "Scan the eSewa QR code shown at checkout and pay.",
                  "Upload the payment screenshot as proof.",
                  "We verify (usually under 15 min) and deliver access to your dashboard & notifications.",
                ].map((s, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="h-8 w-8 shrink-0 rounded-full grid place-items-center text-white font-bold text-sm" style={{ background: "var(--gradient-primary)" }}>{i + 1}</div>
                    <div className="pt-1">{s}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-8 grid sm:grid-cols-3 gap-3">
          {[
            { icon: Check, t: "500+ happy customers" },
            { icon: ShieldCheck, t: "Secure & verified" },
            { icon: Zap, t: "Delivered in minutes" },
          ].map((x, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 flex items-center gap-3">
              <x.icon className="h-5 w-5 text-primary" />
              <div className="text-sm font-medium">{x.t}</div>
            </div>
          ))}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-14">
            <div className="flex items-end justify-between mb-6">
              <h2 className="font-display text-2xl font-bold">You may also like</h2>
              <Link to="/products" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((rp, i) => <ProductCard key={rp.id} product={rp} index={i} />)}
            </div>
          </div>
        )}

        {/* Sticky mobile bar */}
        <div className="fixed bottom-0 inset-x-0 lg:hidden bg-background/95 backdrop-blur border-t p-3 flex items-center gap-2 z-40">
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold gradient-text leading-none truncate">{priceLabel}</div>
            <div className="text-[11px] text-muted-foreground">/ {duration}</div>
          </div>
          <Button onClick={addToCart} variant="outline" size="sm"><ShoppingCart className="h-4 w-4" /></Button>
          <Button onClick={buy} size="sm" className="text-white" style={{ background: "var(--gradient-primary)" }}>Buy now</Button>
        </div>
        <div className="h-16 lg:hidden" />
      </section>
    </PublicLayout>
  );
}