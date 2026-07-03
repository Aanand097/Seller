import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MessageCircle } from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitContactMessage } from "@/lib/contact.functions";
import { CONTACT_EMAIL, buildWhatsAppUrl } from "@/lib/site-config";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — NextGen E-Learning" }] }),
  component: Contact,
});

function Contact() {
  const submit = useServerFn(submitContactMessage);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await submit({ data: { name, email, message } });
      toast.success("Message sent — we'll be in touch shortly!");
      // Also open the user's mail client so the message reaches the inbox directly.
      const subject = encodeURIComponent(`New contact from ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name} <${email}>`);
      window.open(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`, "_blank");
      setName(""); setEmail(""); setMessage("");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicLayout>
      <section className="container mx-auto max-w-2xl px-4 py-20">
        <h1 className="font-display text-5xl font-bold text-center">Get in touch</h1>
        <p className="text-muted-foreground text-center mt-3">We usually reply within an hour.</p>
        <form onSubmit={onSubmit} className="mt-10 space-y-4 glass rounded-2xl p-6">
          <Input required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Textarea required placeholder="How can we help?" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button type="submit" className="w-full text-white" style={{ background: "var(--gradient-primary)" }} disabled={sending}>
            {sending ? "Sending..." : "Send message"}
          </Button>
        </form>
        <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
          <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 rounded-xl border p-3 hover:bg-accent transition">
            <Mail className="h-4 w-4 text-primary" /> {CONTACT_EMAIL}
          </a>
          <a href={buildWhatsAppUrl("Hi! I have a question about NextGen E-Learning.")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border p-3 hover:bg-accent transition">
            <MessageCircle className="h-4 w-4 text-primary" /> Chat on WhatsApp
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}