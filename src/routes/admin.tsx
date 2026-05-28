import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Users, Package, ShoppingBag, MessageCircle, FolderTree } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const ITEMS = [
  { to: "/admin", label: "Overview", Icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/categories", label: "Categories", Icon: FolderTree },
  { to: "/admin/orders", label: "Orders", Icon: ShoppingBag },
  { to: "/admin/users", label: "Users", Icon: Users },
  { to: "/dashboard/chat", label: "Chat", Icon: MessageCircle },
];

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { if (!loading && (!user || !isAdmin)) nav({ to: "/" }); }, [loading, user, isAdmin, nav]);
  if (loading || !user) return <PublicLayout><div className="container py-20 text-center">Loading...</div></PublicLayout>;
  if (!isAdmin) return <PublicLayout><div className="container py-20 text-center">Forbidden</div></PublicLayout>;
  return (
    <PublicLayout>
      <div className="container mx-auto max-w-7xl px-4 py-10 grid md:grid-cols-[240px_1fr] gap-8">
        <aside className="space-y-1">
          <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 px-3">Admin</div>
          {ITEMS.map(({ to, label, Icon }) => (
            <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${path === to ? "bg-accent text-primary font-semibold" : "hover:bg-accent/60"}`}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </aside>
        <div><Outlet /></div>
      </div>
    </PublicLayout>
  );
}