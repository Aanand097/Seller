import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — NexusAI" }] }),
  component: Login,
});

function Login() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    nav({ to: "/dashboard" });
  };

  const forgot = async () => {
    if (!email) return toast.error("Enter your email first");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message); else toast.success("Password reset email sent");
  };

  return (
    <PublicLayout>
      <section className="container mx-auto max-w-md px-4 py-16">
        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-3xl font-bold text-center">Welcome back</h1>
          <p className="text-center text-muted-foreground text-sm mt-2">Sign in to your NexusAI account</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between"><Label>Password</Label><button type="button" onClick={forgot} className="text-xs text-primary">Forgot?</button></div>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy} className="w-full text-white" style={{ background: "var(--gradient-primary)" }}>{busy ? "Signing in..." : "Sign in"}</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">No account? <Link to="/register" className="text-primary font-medium">Create one</Link></p>
        </div>
      </section>
    </PublicLayout>
  );
}