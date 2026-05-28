import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Shield, MessageSquare, ArrowRight, Star, Check } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { ProductCard, type ProductRow } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NexusAI — Premium AI Subscription Marketplace" },
      { name: "description", content: "Discover and buy the world's best AI subscriptions in one premium marketplace." },
      { property: "og:title", content: "NexusAI — Premium AI Subscription Marketplace" },
      { property: "og:description", content: "Discover and buy the world's best AI subscriptions in one premium marketplace." },
    ],
  }),
  component: Index,
});

function Index() {
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string | null }[]>([]);

  useEffect(() => {
    void supabase
      .from("products")
      .select("*, categories(name)")
      .eq("status", "active")
      .eq("featured", true)
      .limit(6)
      .then(({ data }) => setProducts((data as ProductRow[]) ?? []));
    void supabase.from("categories").select("id,name,icon").then(({ data }) => setCategories(data ?? []));
  }, []);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-bg-hero">
        <div className="absolute inset-0 -z-10 opacity-60">
          <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-10 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
        </div>
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-24 text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              The premium AI subscription marketplace
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Every premium <span className="gradient-text">AI tool</span>,<br />one marketplace.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              ChatGPT, Claude, Midjourney, Cursor and more. Browse, subscribe and manage every AI tool you love — in one beautifully unified hub.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="text-white shadow-lg" style={{ background: "var(--gradient-primary)" }}>
                <Link to="/products">Browse AI products <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/register">Create free account</Link>
              </Button>
            </div>
            <div className="mt-10 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-primary" /> Instant delivery</span>
              <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-primary" /> Verified subscriptions</span>
              <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-primary" /> 24/7 support</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Browse by category</h2>
            <p className="text-muted-foreground mt-2">Hand-picked AI tools across every workflow.</p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-primary hidden sm:inline-flex items-center gap-1">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link to="/products" search={{ category: c.id } as any} className="block rounded-2xl border bg-card p-5 hover-lift text-center">
                <div className="h-12 w-12 mx-auto rounded-xl grid place-items-center text-white mb-3" style={{ background: "var(--gradient-primary)" }}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="font-semibold text-sm">{c.name}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Featured subscriptions</h2>
            <p className="text-muted-foreground mt-2">Our most popular premium AI tools.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products === null
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)
            : products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto max-w-7xl px-4 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { Icon: Zap, title: "Instant activation", body: "Get access to your AI subscription within seconds of purchase." },
            { Icon: Shield, title: "Secure & verified", body: "Every subscription is verified and protected with bank-grade security." },
            { Icon: MessageSquare, title: "Real-time support", body: "Chat directly with our team anytime — we're here to help." },
          ].map(({ Icon, title, body }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="rounded-2xl border bg-card p-6">
              <div className="h-11 w-11 rounded-xl grid place-items-center text-white mb-4" style={{ background: "var(--gradient-primary)" }}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">Loved by builders worldwide</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Sarah K.", role: "Product Designer", body: "Finally one place for all my AI tools. The UX is unreal." },
            { name: "James L.", role: "Founder", body: "Cut my procurement time by 80%. Setup was instant." },
            { name: "Aisha M.", role: "Engineer", body: "Premium feel end to end. Support actually responds in minutes." },
          ].map((t) => (
            <div key={t.name} className="rounded-2xl border bg-card p-6">
              <div className="flex gap-0.5 mb-3 text-primary">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="text-sm">{t.body}</p>
              <div className="mt-4 text-xs">
                <div className="font-semibold">{t.name}</div>
                <div className="text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-7xl px-4 pb-20">
        <div className="rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden" style={{ background: "var(--gradient-primary)" }}>
          <h2 className="font-display text-3xl md:text-5xl font-bold">Start your premium AI stack today</h2>
          <p className="mt-4 opacity-90 max-w-xl mx-auto">Join thousands of builders supercharging their workflow with the world's best AI subscriptions.</p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link to="/register">Get started free</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
