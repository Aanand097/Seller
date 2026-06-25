import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/dashboard/chat")({ component: Chat });

function Chat() {
  const { user, isAdmin, loading } = useAuth();
  if (loading || !user) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  return isAdmin ? <AdminInbox userId={user.id} /> : <UserChat userId={user.id} />;
}

/* ---------------- User side ---------------- */

function UserChat({ userId }: { userId: string }) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [adminId, setAdminId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(1);
      const target = admins?.[0]?.user_id ?? userId;
      setAdminId(target);
      const { data } = await supabase.from("messages").select("*").or(`and(sender_id.eq.${userId},receiver_id.eq.${target}),and(sender_id.eq.${target},receiver_id.eq.${userId})`).order("created_at");
      setMsgs(data ?? []);
    })();
    const ch = supabase
      .channel(`chat-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p: any) => {
        const m = p.new;
        if (m.sender_id === userId || m.receiver_id === userId) setMsgs((prev) => [...prev, m]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !adminId) return;
    const message = text.trim();
    setText("");
    await supabase.from("messages").insert({ sender_id: userId, receiver_id: adminId, message });
  };

  return (
    <div className="flex flex-col h-[70vh]">
      <h1 className="font-display text-3xl font-bold mb-4">Chat with support</h1>
      <div className="flex-1 rounded-2xl border bg-card p-4 overflow-y-auto space-y-2">
        {msgs.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Send a message to start the conversation.</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === userId;
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

/* ---------------- Admin inbox ---------------- */

type Msg = { id: string; sender_id: string; receiver_id: string; message: string; created_at: string; seen?: boolean | null };
type Profile = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };

function AdminInbox({ userId: adminId }: { userId: string }) {
  const [all, setAll] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${adminId},receiver_id.eq.${adminId}`)
      .order("created_at");
    const list = (data ?? []) as Msg[];
    setAll(list);
    const userIds = Array.from(new Set(list.map((m) => (m.sender_id === adminId ? m.receiver_id : m.sender_id))));
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", userIds);
      const map: Record<string, Profile> = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`admin-inbox-${adminId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p: any) => {
        const m = p.new as Msg;
        if (m.sender_id === adminId || m.receiver_id === adminId) {
          setAll((prev) => [...prev, m]);
          if (!profiles[m.sender_id] && m.sender_id !== adminId) void load();
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const threads = useMemo(() => {
    const byUser: Record<string, { last: Msg; unread: number }> = {};
    for (const m of all) {
      const other = m.sender_id === adminId ? m.receiver_id : m.sender_id;
      const t = byUser[other] ?? { last: m, unread: 0 };
      if (new Date(m.created_at) >= new Date(t.last.created_at)) t.last = m;
      if (m.receiver_id === adminId && !m.seen) t.unread += 1;
      byUser[other] = t;
    }
    return Object.entries(byUser).sort((a, b) => new Date(b[1].last.created_at).getTime() - new Date(a[1].last.created_at).getTime());
  }, [all, adminId]);

  const conversation = useMemo(
    () => (active ? all.filter((m) => (m.sender_id === active && m.receiver_id === adminId) || (m.sender_id === adminId && m.receiver_id === active)) : []),
    [all, active, adminId],
  );

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation.length]);

  // Mark incoming as seen when opening a thread
  useEffect(() => {
    if (!active) return;
    const unreadIds = all
      .filter((m) => m.sender_id === active && m.receiver_id === adminId && !m.seen)
      .map((m) => m.id);
    if (unreadIds.length) {
      void supabase.from("messages").update({ seen: true }).in("id", unreadIds);
      setAll((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, seen: true } : m)));
    }
  }, [active, all, adminId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !text.trim()) return;
    const msg = text.trim();
    setText("");
    await supabase.from("messages").insert({ sender_id: adminId, receiver_id: active, message: msg });
  };

  const label = (uid: string) => {
    const p = profiles[uid];
    return p?.full_name || p?.email || uid.slice(0, 8);
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-4">Support inbox</h1>
      <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[72vh]">
        <aside className="rounded-2xl border bg-card overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-60" />
              No messages yet.
            </div>
          ) : (
            threads.map(([uid, t]) => (
              <button
                key={uid}
                onClick={() => setActive(uid)}
                className={`w-full text-left p-3 border-b flex items-center gap-3 hover:bg-accent/50 transition ${active === uid ? "bg-accent" : ""}`}
              >
                <div className="h-9 w-9 rounded-full bg-accent grid place-items-center text-xs font-semibold overflow-hidden shrink-0">
                  {profiles[uid]?.avatar_url ? <img src={profiles[uid]!.avatar_url!} alt="" className="h-full w-full object-cover" /> : (label(uid)[0] ?? "?").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm truncate">{label(uid)}</div>
                    <div className="text-[10px] text-muted-foreground shrink-0">{timeAgo(t.last.created_at)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{t.last.sender_id === adminId ? "You: " : ""}{t.last.message}</div>
                </div>
                {t.unread > 0 && (
                  <span className="ml-2 text-[10px] font-bold text-white rounded-full px-1.5 h-5 grid place-items-center" style={{ background: "var(--gradient-primary)" }}>{t.unread}</span>
                )}
              </button>
            ))
          )}
        </aside>
        <section className="rounded-2xl border bg-card flex flex-col">
          {!active ? (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Select a conversation to reply.</div>
          ) : (
            <>
              <div className="p-3 border-b flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-accent grid place-items-center text-xs font-semibold overflow-hidden">
                  {profiles[active]?.avatar_url ? <img src={profiles[active]!.avatar_url!} alt="" className="h-full w-full object-cover" /> : (label(active)[0] ?? "?").toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm">{label(active)}</div>
                  <div className="text-xs text-muted-foreground">{profiles[active]?.email ?? ""}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {conversation.map((m) => {
                  const mine = m.sender_id === adminId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "text-white" : "bg-accent text-foreground"}`} style={mine ? { background: "var(--gradient-primary)" } : undefined}>
                        <div className="text-sm whitespace-pre-wrap">{m.message}</div>
                        <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-muted-foreground"}`}>{timeAgo(m.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="p-3 border-t flex gap-2">
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Reply to ${label(active)}...`} />
                <Button type="submit" className="text-white" style={{ background: "var(--gradient-primary)" }}><Send className="h-4 w-4" /></Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}