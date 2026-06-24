import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { setUserBan, deleteUser } from "@/lib/admin.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const [list, setList] = useState<any[]>([]);
  const banFn = useServerFn(setUserBan);
  const delFn = useServerFn(deleteUser);
  const load = async () => {
    const { data: p } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: r } = await supabase.from("user_roles").select("user_id,role");
    const roleMap: Record<string, string[]> = {};
    (r ?? []).forEach((x: any) => { (roleMap[x.user_id] ||= []).push(x.role); });
    setList((p ?? []).map((u: any) => ({ ...u, roles: roleMap[u.id] ?? [] })));
  };
  useEffect(() => { void load(); }, []);
  const toggleBan = async (id: string, currentlySuspended: boolean) => {
    try {
      await banFn({ data: { userId: id, banned: !currentlySuspended } });
      toast.success(currentlySuspended ? "Login re-enabled" : "Login disabled");
      void load();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };
  const removeUser = async (id: string) => {
    try {
      await delFn({ data: { userId: id } });
      toast.success("User deleted");
      void load();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };
  const toggleAdmin = async (id: string, isAdmin: boolean) => {
    if (isAdmin) await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
    else await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
    void load();
  };
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Users ({list.length})</h1>
      <div className="rounded-2xl border bg-card divide-y">
        {list.map((u) => {
          const isAdmin = u.roles.includes("admin");
          const suspended = u.status !== "active";
          return (
            <div key={u.id} className="p-4 flex items-center gap-3 flex-wrap">
              <div className="h-9 w-9 rounded-full bg-accent grid place-items-center font-bold text-primary">{(u.full_name ?? u.email ?? "U")[0]?.toUpperCase()}</div>
              <div className="flex-1 min-w-[200px]">
                <div className="font-semibold">{u.full_name ?? "Unnamed"}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </div>
              <Badge variant={suspended ? "destructive" : "default"}>{suspended ? "Login disabled" : "Active"}</Badge>
              {isAdmin && <Badge>Admin</Badge>}
              <Button size="sm" variant="outline" onClick={() => toggleAdmin(u.id, isAdmin)}>{isAdmin ? "Demote" : "Make admin"}</Button>
              <Button size="sm" variant="outline" onClick={() => toggleBan(u.id, suspended)}>
                {suspended ? "Enable login" : "Disable login"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Permanently removes {u.email} and all their data. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeUser(u.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        })}
      </div>
    </div>
  );
}