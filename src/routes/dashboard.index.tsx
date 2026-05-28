import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Bell, MessageCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ orders: 0, spent: 0, unread: 0, msgs: 0 });
  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [o, n, m] = await Promise.all([
        supabase.from("orders").select("total_price").eq("user_id", user.id),
        supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("receiver_id", user.id).eq("seen", false),
      ]);
      setStats({
        orders: o.data?.length ?? 0,
        spent: (o.data ?? []).reduce((s, r: any) => s + Number(r.total_price), 0),
        unread: n.count ?? 0,
        msgs: m.count ?? 0,
      });
    })();
  }, [user]);

  const cards = [
    { Icon: ShoppingBag, label: "Orders", value: stats.orders },
    { Icon: Sparkles, label: "Total spent", value: formatPrice(stats.spent) },
    { Icon: Bell, label: "Unread alerts", value: stats.unread },
    { Icon: MessageCircle, label: "New messages", value: stats.msgs },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Welcome back, {profile?.full_name?.split(" ")[0] ?? "there"}</h1>
      <p className="text-muted-foreground mt-1">Here's a snapshot of your account.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {cards.map(({ Icon, label, value }) => (
          <div key={label} className="rounded-2xl border bg-card p-5">
            <div className="h-10 w-10 rounded-xl grid place-items-center text-white mb-3" style={{ background: "var(--gradient-primary)" }}><Icon className="h-5 w-5" /></div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}