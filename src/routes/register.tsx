import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(2, "Name too short").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  age: z.string().optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
});

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — NexusAI" }] }),
  component: Register,
});

function Register() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ full_name: "", email: "", password: "", phone: "", age: "", address: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: f.full_name, phone: f.phone, age: f.age, address: f.address },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      toast.success("Account created! Welcome aboard.");
      nav({ to: "/dashboard" });
    } else {
      toast.success("Check your email to verify your account!");
      nav({ to: "/login" });
    }
  };

  return (
    <PublicLayout>
      <section className="container mx-auto max-w-md px-4 py-16">
        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-3xl font-bold text-center">Create your account</h1>
          <p className="text-center text-muted-foreground text-sm mt-2">Join the premium AI marketplace</p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <div className="space-y-1.5"><Label>Full name</Label><Input required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Gmail address</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Password</Label><Input type="password" required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Age</Label><Input type="number" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Address</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
            <Button type="submit" disabled={busy} className="w-full text-white" style={{ background: "var(--gradient-primary)" }}>{busy ? "Creating..." : "Create account"}</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">Already have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link></p>
        </div>
      </section>
    </PublicLayout>
  );
}