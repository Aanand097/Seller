import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { ProductCard, type ProductRow } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "AI Products — NexusAI" }, { name: "description", content: "Browse premium AI subscriptions across every category." }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [sort, setSort] = useState<"new" | "low" | "high">("new");

  useEffect(() => {
    void supabase.from("products").select("*, categories(name)").eq("status", "active").then(({ data }) => setProducts((data as ProductRow[]) ?? []));
    void supabase.from("categories").select("id,name").then(({ data }) => setCats(data ?? []));
  }, []);

  const filtered = useMemo(() => {
    if (!products) return null;
    let r = products;
    if (q) r = r.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()) || (p.description ?? "").toLowerCase().includes(q.toLowerCase()));
    if (cat) r = r.filter((p) => p.category_id === cat);
    r = [...r];
    if (sort === "low") r.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "high") r.sort((a, b) => Number(b.price) - Number(a.price));
    return r;
  }, [products, q, cat, sort]);

  return (
    <PublicLayout>
      <section className="container mx-auto max-w-7xl px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold">All AI products</h1>
          <p className="text-muted-foreground mt-3">Premium subscriptions, verified instantly.</p>
        </div>
        <div className="glass rounded-2xl p-4 flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <select value={cat ?? ""} onChange={(e) => setCat(e.target.value || null)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">All categories</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="new">Newest</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered === null
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)
            : filtered.length === 0
              ? <div className="col-span-full text-center py-20 text-muted-foreground">No products found.</div>
              : filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>
    </PublicLayout>
  );
}