import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, Users, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function AdminOverview() {
  const [s, setS] = useState({ revenue: 0, orders: 0, users: 0, products: 0 });
  const [series, setSeries] = useState<{ d: string; v: number }[]>([]);
  useEffect(() => {
    void (async () => {
      const [o, u, p] = await Promise.all([
        supabase.from("orders").select("total_price,created_at"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
      ]);
      const orders = o.data ?? [];
      const revenue = orders.reduce((sum, r: any) => sum + Number(r.total_price), 0);
      setS({ revenue, orders: orders.length, users: u.count ?? 0, products: p.count ?? 0 });
      const by: Record<string, number> = {};
      orders.forEach((r: any) => {
        const d = new Date(r.created_at).toLocaleDateString("en", { month: "short", day: "numeric" });
        by[d] = (by[d] ?? 0) + Number(r.total_price);
      });
      setSeries(Object.entries(by).map(([d, v]) => ({ d, v })).slice(-14));
    })();
  }, []);
  const cards = [
    { Icon: DollarSign, label: "Revenue", value: formatPrice(s.revenue) },
    { Icon: ShoppingBag, label: "Orders", value: s.orders },
    { Icon: Users, label: "Users", value: s.users },
    { Icon: Package, label: "Products", value: s.products },
  ];
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mt-1">Business at a glance.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {cards.map(({ Icon, label, value }) => (
          <div key={label} className="rounded-2xl border bg-card p-5">
            <div className="h-10 w-10 rounded-xl grid place-items-center text-white mb-3" style={{ background: "var(--gradient-primary)" }}><Icon className="h-5 w-5" /></div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border bg-card p-5">
        <h3 className="font-display font-bold text-lg mb-4">Revenue (last 14 days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.62 0.19 252)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="oklch(0.62 0.19 252)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="v" stroke="oklch(0.62 0.19 252)" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}