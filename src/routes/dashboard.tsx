import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, ShoppingBag, Bell, MessageCircle, User as UserIcon, ShieldCheck } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/dashboard")({
  component: DashLayout,
});

const ITEMS = [
  { to: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  { to: "/dashboard/orders", label: "Orders", Icon: ShoppingBag },
  { to: "/dashboard/notifications", label: "Notifications", Icon: Bell },
  { to: "/dashboard/chat", label: "Chat", Icon: MessageCircle },
  { to: "/dashboard/profile", label: "Profile", Icon: UserIcon },
];

function DashLayout() {
  const { user, loading, isAdmin } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);
  if (loading || !user) return <PublicLayout><div className="container mx-auto py-20 text-center text-muted-foreground">Loading...</div></PublicLayout>;

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-7xl px-4 py-10 grid md:grid-cols-[240px_1fr] gap-8">
        <aside className="space-y-1">
          {ITEMS.map(({ to, label, Icon }) => (
            <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${path === to ? "bg-accent text-primary font-semibold" : "hover:bg-accent/60"}`}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent/60 mt-4 border-t pt-4">
              <ShieldCheck className="h-4 w-4" /> Admin panel
            </Link>
          )}
        </aside>
        <div><Outlet /></div>
      </div>
    </PublicLayout>
  );
}