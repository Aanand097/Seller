import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/dashboard/notifications")({ component: Notifs });

function Notifs() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    void supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setList(data ?? []));
    void supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  }, [user]);
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Notifications</h1>
      {list.length === 0 ? <p className="text-muted-foreground">No notifications yet.</p> : (
        <div className="space-y-2">
          {list.map((n) => (
            <div key={n.id} className="rounded-xl border bg-card p-4 flex gap-3">
              <div className="h-9 w-9 rounded-lg grid place-items-center text-primary bg-accent shrink-0"><Bell className="h-4 w-4" /></div>
              <div className="flex-1">
                <div className="font-semibold">{n.title}</div>
                <div className="text-sm text-muted-foreground">{n.message}</div>
                <div className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}