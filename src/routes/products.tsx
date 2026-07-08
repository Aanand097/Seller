import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { ProductCard, type ProductRow } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const productsQuery = queryOptions({
  queryKey: ["products", "active"],
  queryFn: async () => {
    const { data } = await supabase.from("products").select("*, categories(name)").eq("status", "active");
    return (data as ProductRow[]) ?? [];
  },
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
});

const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data } = await supabase.from("categories").select("id,name");
    return data ?? [];
  },
  staleTime: 30 * 60_000,
  gcTime: 60 * 60_000,
});

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Courses & AI Tools — NextGen E-Learning" }, { name: "description", content: "Browse premium courses and AI learning subscriptions across every category." }] }),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(productsQuery);
    void context.queryClient.prefetchQuery(categoriesQuery);
  },
  component: ProductsPage,
});

function ProductsPage() {
  const qc = useQueryClient();
  const { data: products } = useQuery(productsQuery);
  const { data: cats = [] } = useQuery(categoriesQuery);
  useEffect(() => {
    if (!products) return;
    for (const p of products) qc.setQueryData(["product", p.id], p);
  }, [products, qc]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [sort, setSort] = useState<"new" | "low" | "high">("new");

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
          <h1 className="font-display text-4xl md:text-5xl font-bold">All courses & tools</h1>
          <p className="text-muted-foreground mt-3">Premium learning subscriptions, activated instantly.</p>
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