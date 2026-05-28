import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — NexusAI" }] }),
  component: Contact,
});

function Contact() {
  const [s, setS] = useState(false);
  return (
    <PublicLayout>
      <section className="container mx-auto max-w-2xl px-4 py-20">
        <h1 className="font-display text-5xl font-bold text-center">Get in touch</h1>
        <p className="text-muted-foreground text-center mt-3">We usually reply within an hour.</p>
        <form onSubmit={(e) => { e.preventDefault(); setS(true); toast.success("Message sent — we'll be in touch!"); }} className="mt-10 space-y-4 glass rounded-2xl p-6">
          <Input required placeholder="Your name" />
          <Input required type="email" placeholder="Email" />
          <Textarea required placeholder="How can we help?" rows={5} />
          <Button type="submit" className="w-full text-white" style={{ background: "var(--gradient-primary)" }} disabled={s}>{s ? "Sent" : "Send message"}</Button>
        </form>
      </section>
    </PublicLayout>
  );
}