import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: Reset,
});

function Reset() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    nav({ to: "/dashboard" });
  };
  return (
    <PublicLayout>
      <section className="container mx-auto max-w-md px-4 py-16">
        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-3xl font-bold text-center">Set a new password</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5"><Label>New password</Label><Input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <Button type="submit" disabled={busy} className="w-full text-white" style={{ background: "var(--gradient-primary)" }}>{busy ? "Updating..." : "Update password"}</Button>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}