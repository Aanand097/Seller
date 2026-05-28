import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/dashboard/chat")({ component: Chat });

function Chat() {
  const { user, isAdmin } = useAuth();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [adminId, setAdminId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(1);
      const target = admins?.[0]?.user_id ?? user.id;
      setAdminId(target);
      const { data } = await supabase.from("messages").select("*").or(`and(sender_id.eq.${user.id},receiver_id.eq.${target}),and(sender_id.eq.${target},receiver_id.eq.${user.id})`).order("created_at");
      setMsgs(data ?? []);
    })();
    const ch = supabase
      .channel(`chat-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p: any) => {
        const m = p.new;
        if (m.sender_id === user.id || m.receiver_id === user.id) setMsgs((prev) => [...prev, m]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim() || !adminId) return;
    const message = text.trim();
    setText("");
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: adminId, message });
  };

  return (
    <div className="flex flex-col h-[70vh]">
      <h1 className="font-display text-3xl font-bold mb-4">{isAdmin ? "Support inbox" : "Chat with support"}</h1>
      <div className="flex-1 rounded-2xl border bg-card p-4 overflow-y-auto space-y-2">
        {msgs.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Send a message to start the conversation.</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "text-white" : "bg-accent text-foreground"}`} style={mine ? { background: "var(--gradient-primary)" } : undefined}>
                <div className="text-sm">{m.message}</div>
                <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-muted-foreground"}`}>{timeAgo(m.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
        <Button type="submit" className="text-white" style={{ background: "var(--gradient-primary)" }}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}