import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/profile")({ component: Profile });

function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [f, setF] = useState({ full_name: "", phone: "", age: "", address: "", avatar_url: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (profile) setF({ full_name: profile.full_name ?? "", phone: profile.phone ?? "", age: String(profile.age ?? ""), address: profile.address ?? "", avatar_url: profile.avatar_url ?? "" });
  }, [profile]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: f.full_name, phone: f.phone, age: f.age ? Number(f.age) : null, address: f.address, avatar_url: f.avatar_url }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Profile updated"); void refreshProfile(); }
  };
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Profile</h1>
      <form onSubmit={save} className="space-y-4 max-w-lg glass rounded-2xl p-6">
        <div className="space-y-1.5"><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Avatar URL</Label><Input value={f.avatar_url} onChange={(e) => setF({ ...f, avatar_url: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Age</Label><Input type="number" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></div>
        </div>
        <div className="space-y-1.5"><Label>Address</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
        <Button type="submit" disabled={busy} className="text-white" style={{ background: "var(--gradient-primary)" }}>{busy ? "Saving..." : "Save changes"}</Button>
      </form>
    </div>
  );
}