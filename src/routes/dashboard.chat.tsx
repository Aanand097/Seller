import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Inbox, X, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timeAgo, formatPrice } from "@/lib/format";

type Search = { product?: string };

export const Route = createFileRoute("/dashboard/chat")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    product: typeof s.product === "string" ? s.product : undefined,
  }),
  component: Chat,
});

function Chat() {
  const { user, isAdmin, loading } = useAuth();
  if (loading || !user) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  return isAdmin ? <AdminInbox userId={user.id} /> : <UserChat userId={user.id} />;
}

type ProductLite = { id: string; title: string; price: number; image_url: string | null };

function useProductsByIds(ids: string[]) {
  const [map, setMap] = useState<Record<string, ProductLite>>({});
  useEffect(() => {
    const missing = ids.filter((id) => id && !map[id]);
    if (!missing.length) return;
    void supabase.from("products").select("id,title,price,image_url").in("id", missing).then(({ data }) => {
      if (!data) return;
      setMap((prev) => {
        const next = { ...prev };
        for (const p of data as any[]) next[p.id] = p as ProductLite;
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);
  return map;
}

function ProductChip({ p, compact = false }: { p?: ProductLite; compact?: boolean }) {
  if (!p) return null;
  return (
    <a
      href={`/products/${p.id}`}
      className={`flex items-center gap-2 rounded-lg border bg-background/80 backdrop-blur p-1.5 mb-1.5 hover:bg-accent transition ${compact ? "text-xs" : "text-xs"}`}
    >
      {p.image_url ? (
        <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
      ) : (
        <div className="h-8 w-8 rounded grid place-items-center bg-accent shrink-0"><Package className="h-3.5 w-3.5" /></div>
      )}
      <div className="min-w-0">
        <div className="font-semibold truncate text-foreground">{p.title}</div>
        <div className="text-muted-foreground">{formatPrice(Number(p.price))}</div>
      </div>
    </a>
  );
}

/* ---------------- User side ---------------- */

function UserChat({ userId }: { userId: string }) {
  const { product: productParam } = Route.useSearch();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [adminId, setAdminId] = useState<string | null>(null);
  const [attachedProduct, setAttachedProduct] = useState<string | undefined>(productParam);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setAttachedProduct(productParam); }, [productParam]);

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

  const productIds = useMemo(
    () => Array.from(new Set([...(attachedProduct ? [attachedProduct] : []), ...msgs.map((m) => m.product_id).filter(Boolean)])),
    [msgs, attachedProduct],
  );
  const products = useProductsByIds(productIds);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !adminId) return;
    const message = text.trim();
    const payload: any = { sender_id: userId, receiver_id: adminId, message };
    if (attachedProduct) payload.product_id = attachedProduct;
    setText("");
    await supabase.from("messages").insert(payload);
    setAttachedProduct(undefined);
    void navigate({ to: "/dashboard/chat", search: {} });
  };

  return (
    <div className="flex flex-col h-[70vh]">
      <h1 className="font-display text-3xl font-bold mb-4">Chat with support</h1>
      <div className="flex-1 rounded-2xl border bg-card p-4 overflow-y-auto space-y-2">
        {msgs.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Send a message to start the conversation.</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === userId;
          const prod = m.product_id ? products[m.product_id] : undefined;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${mine ? "text-white" : "bg-accent text-foreground"}`} style={mine ? { background: "var(--gradient-primary)" } : undefined}>
                {prod && <ProductChip p={prod} />}
                <div className="text-sm px-1">{m.message}</div>
                <div className={`text-[10px] mt-1 px-1 ${mine ? "text-white/70" : "text-muted-foreground"}`}>{timeAgo(m.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {attachedProduct && (
        <div className="mt-2 rounded-xl border bg-card p-2 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Asking about</div>
            <ProductChip p={products[attachedProduct]} />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => { setAttachedProduct(undefined); void navigate({ to: "/dashboard/chat", search: {} }); }} aria-label="Remove attached product">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <form onSubmit={send} className="mt-3 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={attachedProduct ? "Ask about this product..." : "Type a message..."} />
        <Button type="submit" className="text-white" style={{ background: "var(--gradient-primary)" }}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}

/* ---------------- Admin inbox ---------------- */

type Msg = { id: string; sender_id: string; receiver_id: string; message: string; created_at: string; seen?: boolean | null; product_id?: string | null };
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

  const productIds = useMemo(
    () => Array.from(new Set(all.map((m) => m.product_id).filter(Boolean) as string[])),
    [all],
  );
  const products = useProductsByIds(productIds);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation.length]);

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

  const lastProductForActive = useMemo(() => {
    if (!active) return undefined;
    const withProduct = conversation.filter((m) => m.product_id);
    const last = withProduct[withProduct.length - 1];
    return last?.product_id ? products[last.product_id] : undefined;
  }, [conversation, products, active]);

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
            threads.map(([uid, t]) => {
              const lastProd = t.last.product_id ? products[t.last.product_id] : undefined;
              return (
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
                    {lastProd && (
                      <div className="text-[10px] mt-1 inline-flex items-center gap-1 text-primary font-medium truncate max-w-full">
                        <Package className="h-3 w-3 shrink-0" /> <span className="truncate">{lastProd.title}</span>
                      </div>
                    )}
                  </div>
                  {t.unread > 0 && (
                    <span className="ml-2 text-[10px] font-bold text-white rounded-full px-1.5 h-5 grid place-items-center" style={{ background: "var(--gradient-primary)" }}>{t.unread}</span>
                  )}
                </button>
              );
            })
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
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{label(active)}</div>
                  <div className="text-xs text-muted-foreground truncate">{profiles[active]?.email ?? ""}</div>
                </div>
                {lastProductForActive && (
                  <a href={`/products/${lastProductForActive.id}`} className="hidden md:flex items-center gap-2 rounded-lg border px-2 py-1 text-xs hover:bg-accent" title="Latest product in this conversation">
                    <Package className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium truncate max-w-[180px]">{lastProductForActive.title}</span>
                  </a>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {conversation.map((m) => {
                  const mine = m.sender_id === adminId;
                  const prod = m.product_id ? products[m.product_id] : undefined;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${mine ? "text-white" : "bg-accent text-foreground"}`} style={mine ? { background: "var(--gradient-primary)" } : undefined}>
                        {prod && <ProductChip p={prod} />}
                        <div className="text-sm px-1">{m.message}</div>
                        <div className={`text-[10px] mt-1 px-1 ${mine ? "text-white/70" : "text-muted-foreground"}`}>{timeAgo(m.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="p-3 border-t flex gap-2">
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply..." />
                <Button type="submit" className="text-white" style={{ background: "var(--gradient-primary)" }}><Send className="h-4 w-4" /></Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
