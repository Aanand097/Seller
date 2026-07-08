import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles, ShoppingCart, MessageCircle, Check, ArrowLeft,
  Zap, ShieldCheck, Clock, Headphones, CreditCard, PackageCheck, KeyRound,
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
    let q = supabase.from("products").select("*, categories(name)").eq("status", "active").neq("id", excludeId).limit(3);
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
  head: ({ params }) => ({
    meta: [
      { title: `Product — NextGen E-Learning` },
      { name: "description", content: `Get premium access instantly. Product ${params.id}.` },
    ],
  }),
  pendingComponent: () => (
    <PublicLayout>
      <section className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid md:grid-cols-2 gap-10">
          <Skeleton className="aspect-[4/3] rounded-2xl" />
          <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-6" /><Skeleton className="h-24" /></div>
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

  if (!p) return null;

  const priceLabel = formatPrice(Number(p.price));
  const duration = p.subscription_duration ?? "subscription";

  const buy = async () => {
    if (!user) return navigate({ to: "/login" });
    try { await addProductToCart(user.id, id); } catch (e: any) { toast.error(e?.message ?? "Could not add to cart"); return; }
    navigate({ to: "/cart" });
  };
  const addToCart = async () => {
    if (!user) return navigate({ to: "/login" });
    try { await addProductToCart(user.id, id); toast.success("Added to cart"); }
    catch (e: any) { toast.error(e?.message ?? "Could not add to cart"); }
  };

  const features = [
    { icon: Zap, title: "Instant activation", desc: "Delivered within minutes of payment confirmation." },
    { icon: ShieldCheck, title: "100% genuine", desc: "Verified premium account, safe and secure." },
    { icon: Clock, title: `Full ${duration}`, desc: "Uninterrupted access for the entire duration." },
    { icon: Headphones, title: "24/7 support", desc: "Chat with us anytime via WhatsApp or in-app chat." },
  ];

  const steps = [
    { icon: ShoppingCart, title: "Add to cart", desc: "Pick your plan and add it to your cart." },
    { icon: CreditCard, title: "Pay via eSewa / QR", desc: "Scan the QR at checkout and upload proof — takes 1 minute." },
    { icon: PackageCheck, title: "We verify", desc: "Our team confirms your payment (usually under 15 min)." },
    { icon: KeyRound, title: "Get access", desc: "Login details arrive in your dashboard & notifications." },
  ];

  return (
    <PublicLayout>
      <section className="container mx-auto max-w-6xl px-4 py-10">
        <Link to="/products" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Link>

        <div className="grid md:grid-cols-2 gap-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="aspect-[4/3] rounded-2xl overflow-hidden border bg-gradient-to-br from-accent to-white grid place-items-center">
            {p.image_url ? (
              <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" loading="eager" />
            ) : (
              <div className="h-28 w-28 rounded-2xl grid place-items-center text-white" style={{ background: "var(--gradient-primary)" }}>
                <Sparkles className="h-14 w-14" />
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-3">
              {p.categories?.name && <Badge variant="secondary">{p.categories.name}</Badge>}
              {p.featured && (
                <Badge className="text-white border-0" style={{ background: "var(--gradient-primary)" }}>★ Featured</Badge>
              )}
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight">{p.title}</h1>
            <p className="text-muted-foreground mt-3 text-base leading-relaxed">
              {p.description || "Premium subscription delivered instantly with full support from NextGen E-Learning."}
            </p>

            <div className="mt-6 flex items-baseline gap-2">
              <div className="text-4xl font-bold gradient-text">{priceLabel}</div>
              <div className="text-muted-foreground">/ {duration}</div>
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-2 text-sm">
              {["Instant activation", "Verified account", "Full duration", "24/7 support"].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={buy} size="lg" className="text-white" style={{ background: "var(--gradient-primary)" }}>Buy now</Button>
              <Button onClick={addToCart} size="lg" variant="outline"><ShoppingCart className="h-4 w-4 mr-2" />Add to cart</Button>
              <Button onClick={() => navigate({ to: "/dashboard/chat", search: { product: id } as any })} size="lg" variant="ghost">
                <MessageCircle className="h-4 w-4 mr-2" />Ask a question
              </Button>
              <a
                href={buildWhatsAppUrl(`Hi! I'm interested in "${p.title}" (${priceLabel}). Can you tell me more?`)}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-[#25D366] text-white font-medium hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.555-5.338 11.89-11.893 11.89a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                WhatsApp
              </a>
            </div>
          </motion.div>
        </div>

        {/* Why buy */}
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold mb-6">Why buy from NextGen E-Learning?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border bg-card p-5 hover-lift">
                <div className="h-10 w-10 rounded-xl grid place-items-center text-white mb-3" style={{ background: "var(--gradient-primary)" }}>
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{f.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How to buy */}
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold mb-2">How to buy — 4 easy steps</h2>
          <p className="text-muted-foreground mb-6">Simple, fast, and fully guided. You'll get access the same day.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={s.title} className="rounded-2xl border bg-card p-5 relative">
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full grid place-items-center text-white font-bold text-sm" style={{ background: "var(--gradient-primary)" }}>{i + 1}</div>
                <s.icon className="h-6 w-6 text-primary mb-3" />
                <div className="font-semibold">{s.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold mb-6">Frequently asked</h2>
          <div className="space-y-3">
            {[
              { q: "How fast will I get access?", a: "Most orders are delivered within 15 minutes of payment verification. Larger orders may take up to a few hours." },
              { q: "Which payment methods do you accept?", a: "eSewa and QR-based mobile payments. Scan the QR at checkout, pay, and upload the screenshot." },
              { q: "Is the account safe and genuine?", a: "Yes — every subscription is a verified premium account. If anything goes wrong during the duration, we replace it free." },
              { q: "What if I need help?", a: "Chat with us in the dashboard or message us on WhatsApp — we reply 24/7." },
            ].map((f) => (
              <details key={f.q} className="rounded-xl border bg-card p-4 group">
                <summary className="cursor-pointer font-medium flex justify-between items-center">
                  {f.q}
                  <span className="text-primary group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="text-sm text-muted-foreground mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl font-bold mb-6">You may also like</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rp, i) => <ProductCard key={rp.id} product={rp} index={i} />)}
            </div>
          </div>
        )}

        {/* Sticky bottom CTA on mobile */}
        <div className="fixed bottom-0 inset-x-0 md:hidden bg-background/95 backdrop-blur border-t p-3 flex items-center gap-3 z-40">
          <div className="flex-1">
            <div className="text-lg font-bold gradient-text leading-none">{priceLabel}</div>
            <div className="text-[11px] text-muted-foreground">/ {duration}</div>
          </div>
          <Button onClick={addToCart} variant="outline" size="sm"><ShoppingCart className="h-4 w-4" /></Button>
          <Button onClick={buy} size="sm" className="text-white" style={{ background: "var(--gradient-primary)" }}>Buy now</Button>
        </div>
      </section>
    </PublicLayout>
  );
}