import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Send, Inbox, X, Package, Paperclip, ImageIcon, CheckCircle2, XCircle, Check, CheckCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timeAgo, formatPrice } from "@/lib/format";
import { toast } from "sonner";

type Search = { product?: string };

export const Route = createFileRoute("/dashboard/chat")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    product: typeof s.product === "string" ? s.product : undefined,
  }),
  component: Chat,
});

type Msg = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  seen?: boolean | null;
  delivered?: boolean | null;
  product_id?: string | null;
  image_url?: string | null;
  payment_proof?: boolean | null;
  payment_status?: "pending" | "approved" | "rejected" | null;
};
type ProductLite = { id: string; title: string; price: number; image_url: string | null };
type Profile = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };

function Chat() {
  const { user, isAdmin, loading } = useAuth();
  if (loading || !user) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  return isAdmin ? <AdminInbox adminId={user.id} /> : <UserChat userId={user.id} />;
}

/* ---------- shared helpers ---------- */

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

function useSignedUrls(paths: string[]) {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    const missing = paths.filter((p) => p && !map[p]);
    if (!missing.length) return;
    void (async () => {
      const results = await Promise.all(
        missing.map(async (p) => {
          const { data } = await supabase.storage.from("chat-uploads").createSignedUrl(p, 60 * 60);
          return [p, data?.signedUrl ?? ""] as const;
        }),
      );
      setMap((prev) => {
        const next = { ...prev };
        for (const [p, url] of results) if (url) next[p] = url;
        return next;
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths.join(",")]);
  return map;
}

function ProductChip({ p }: { p?: ProductLite }) {
  if (!p) return null;
  return (
    <a href={`/products/${p.id}`} className="flex items-center gap-2 rounded-lg border bg-background/80 backdrop-blur p-1.5 mb-1.5 hover:bg-accent transition text-xs">
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

function PaymentStatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const map = {
    pending: { text: "Payment pending review", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
    approved: { text: "Payment approved", cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
    rejected: { text: "Payment rejected", cls: "bg-red-500/15 text-red-600 border-red-500/30" },
  } as const;
  const m = map[status as keyof typeof map];
  if (!m) return null;
  return <div className={`mt-1 inline-block text-[10px] font-semibold border rounded-full px-2 py-0.5 ${m.cls}`}>{m.text}</div>;
}

function AttachmentImage({ path, signed }: { path: string; signed?: string }) {
  if (!signed) return <div className="h-40 w-56 rounded-lg bg-accent grid place-items-center text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  return (
    <a href={signed} target="_blank" rel="noopener noreferrer" className="block">
      <img src={signed} alt="attachment" className="max-h-64 rounded-lg border object-cover" />
    </a>
  );
}

async function uploadChatImage(userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safe = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${safe}`;
  const { error } = await supabase.storage.from("chat-uploads").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

function validateImage(file: File): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Only JPG, PNG or WEBP allowed.";
  if (file.size > 5 * 1024 * 1024) return "Max file size is 5MB.";
  return null;
}

/* ---------- USER SIDE ---------- */

function UserChat({ userId }: { userId: string }) {
  const { product: productParam } = Route.useSearch();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [adminId, setAdminId] = useState<string | null>(null);
  const [attachedProduct, setAttachedProduct] = useState<string | undefined>(productParam);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [markAsPayment, setMarkAsPayment] = useState(false);
  const [sending, setSending] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeout = useRef<any>(null);

  useEffect(() => { setAttachedProduct(productParam); }, [productParam]);

  useEffect(() => {
    void (async () => {
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(1);
      const target = admins?.[0]?.user_id ?? userId;
      setAdminId(target);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${target}),and(sender_id.eq.${target},receiver_id.eq.${userId})`)
        .order("created_at");
      setMsgs((data ?? []) as Msg[]);
    })();
  }, [userId]);

  useEffect(() => {
    if (!adminId) return;
    const ch = supabase
      .channel(`chat:${userId}:${adminId}`, { config: { broadcast: { self: false } } })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p: any) => {
        const m = p.new as Msg;
        if ((m.sender_id === userId && m.receiver_id === adminId) || (m.sender_id === adminId && m.receiver_id === userId)) {
          setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.receiver_id === userId) {
            void supabase.from("messages").update({ seen: true, delivered: true }).eq("id", m.id);
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (p: any) => {
        const m = p.new as Msg;
        setMsgs((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
      })
      .on("broadcast", { event: "typing" }, (p: any) => {
        if (p.payload?.from === adminId) {
          setAdminTyping(true);
          clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setAdminTyping(false), 2500);
        }
      })
      .subscribe();
    channelRef.current = ch;
    return () => { void supabase.removeChannel(ch); channelRef.current = null; };
  }, [userId, adminId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length, adminTyping]);

  // Mark inbound as seen on open
  useEffect(() => {
    if (!adminId) return;
    const unread = msgs.filter((m) => m.sender_id === adminId && m.receiver_id === userId && !m.seen).map((m) => m.id);
    if (unread.length) void supabase.from("messages").update({ seen: true, delivered: true }).in("id", unread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs.length, adminId]);

  const productIds = useMemo(
    () => Array.from(new Set([...(attachedProduct ? [attachedProduct] : []), ...msgs.map((m) => m.product_id).filter(Boolean) as string[]])),
    [msgs, attachedProduct],
  );
  const products = useProductsByIds(productIds);
  const imagePaths = useMemo(() => msgs.map((m) => m.image_url).filter(Boolean) as string[], [msgs]);
  const signed = useSignedUrls(imagePaths);

  const onPickFile = (f: File | null) => {
    if (!f) { setFile(null); setPreview(null); return; }
    const err = validateImage(f);
    if (err) { toast.error(err); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onTyping = useCallback(() => {
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { from: userId } });
  }, [userId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || !adminId) return;
    if (!text.trim() && !file) return;
    setSending(true);
    try {
      let imagePath: string | null = null;
      if (file) imagePath = await uploadChatImage(userId, file);
      const payload: any = {
        sender_id: userId,
        receiver_id: adminId,
        message: text.trim() || (file ? "📎 Image" : ""),
      };
      if (attachedProduct) payload.product_id = attachedProduct;
      if (imagePath) payload.image_url = imagePath;
      if (markAsPayment && imagePath) { payload.payment_proof = true; payload.payment_status = "pending"; }
      const { error } = await supabase.from("messages").insert(payload);
      if (error) throw error;
      setText(""); setFile(null); setPreview(null); setMarkAsPayment(false); setAttachedProduct(undefined);
      if (fileRef.current) fileRef.current.value = "";
      void navigate({ to: "/dashboard/chat", search: {} });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh]">
      <h1 className="font-display text-3xl font-bold mb-1">Chat with support</h1>
      <p className="text-xs text-muted-foreground mb-3">Send messages, upload payment screenshots (JPG/PNG/WEBP, ≤5MB). Replies arrive live.</p>
      <div className="flex-1 rounded-2xl border bg-card p-4 overflow-y-auto space-y-2">
        {msgs.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Send a message to start the conversation.</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === userId;
          const prod = m.product_id ? products[m.product_id] : undefined;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? "text-white" : "bg-accent text-foreground"}`} style={mine ? { background: "var(--gradient-primary)" } : undefined}>
                {prod && <ProductChip p={prod} />}
                {m.image_url && <div className="mb-1"><AttachmentImage path={m.image_url} signed={signed[m.image_url]} /></div>}
                {m.message && <div className="text-sm px-1 whitespace-pre-wrap break-words">{m.message}</div>}
                <PaymentStatusBadge status={m.payment_status ?? undefined} />
                <div className={`text-[10px] mt-1 px-1 flex items-center gap-1 ${mine ? "text-white/80" : "text-muted-foreground"}`}>
                  <span>{timeAgo(m.created_at)}</span>
                  {mine && (m.seen ? <CheckCheck className="h-3 w-3" /> : m.delivered ? <CheckCheck className="h-3 w-3 opacity-60" /> : <Check className="h-3 w-3 opacity-60" />)}
                </div>
              </div>
            </div>
          );
        })}
        {adminTyping && <div className="text-xs text-muted-foreground italic px-2">Support is typing…</div>}
        <div ref={bottomRef} />
      </div>

      {attachedProduct && (
        <div className="mt-2 rounded-xl border bg-card p-2 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Asking about</div>
            <ProductChip p={products[attachedProduct]} />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => { setAttachedProduct(undefined); void navigate({ to: "/dashboard/chat", search: {} }); }}><X className="h-4 w-4" /></Button>
        </div>
      )}

      {preview && (
        <div className="mt-2 rounded-xl border bg-card p-2 flex items-center gap-3">
          <img src={preview} alt="preview" className="h-16 w-16 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{file?.name}</div>
            <label className="flex items-center gap-2 text-xs mt-1 cursor-pointer select-none">
              <input type="checkbox" checked={markAsPayment} onChange={(e) => setMarkAsPayment(e.target.checked)} />
              Mark as payment proof (admin will verify)
            </label>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onPickFile(null)}><X className="h-4 w-4" /></Button>
        </div>
      )}

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />
        <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()} title="Attach image"><Paperclip className="h-4 w-4" /></Button>
        <Input value={text} onChange={(e) => { setText(e.target.value); onTyping(); }} placeholder={attachedProduct ? "Ask about this product…" : "Type a message…"} />
        <Button type="submit" disabled={sending || (!text.trim() && !file)} className="text-white" style={{ background: "var(--gradient-primary)" }}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

/* ---------- ADMIN SIDE ---------- */

function AdminInbox({ adminId }: { adminId: string }) {
  const [all, setAll] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeout = useRef<any>(null);

  const loadProfiles = async (ids: string[]) => {
    if (!ids.length) return;
    const { data: profs } = await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", ids);
    if (!profs) return;
    setProfiles((prev) => {
      const next = { ...prev };
      for (const p of profs as any[]) next[p.id] = p;
      return next;
    });
  };

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${adminId},receiver_id.eq.${adminId}`)
        .order("created_at");
      const list = (data ?? []) as Msg[];
      setAll(list);
      const ids = Array.from(new Set(list.map((m) => (m.sender_id === adminId ? m.receiver_id : m.sender_id))));
      await loadProfiles(ids);
    })();
  }, [adminId]);

  useEffect(() => {
    const ch = supabase
      .channel(`admin-inbox:${adminId}`, { config: { broadcast: { self: false } } })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p: any) => {
        const m = p.new as Msg;
        if (m.sender_id === adminId || m.receiver_id === adminId) {
          setAll((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          const other = m.sender_id === adminId ? m.receiver_id : m.sender_id;
          if (!profiles[other]) void loadProfiles([other]);
          if (m.receiver_id === adminId) {
            void supabase.from("messages").update({ delivered: true }).eq("id", m.id);
            if (Notification && Notification.permission === "granted") {
              new Notification("New message", { body: m.message?.slice(0, 80) });
            }
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (p: any) => {
        const m = p.new as Msg;
        setAll((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
      })
      .on("broadcast", { event: "typing" }, (p: any) => {
        if (active && p.payload?.from === active) {
          setUserTyping(true);
          clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setUserTyping(false), 2500);
        }
      })
      .subscribe();
    channelRef.current = ch;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    return () => { void supabase.removeChannel(ch); channelRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId, active]);

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

  const productIds = useMemo(() => Array.from(new Set(all.map((m) => m.product_id).filter(Boolean) as string[])), [all]);
  const products = useProductsByIds(productIds);
  const imagePaths = useMemo(() => all.map((m) => m.image_url).filter(Boolean) as string[], [all]);
  const signed = useSignedUrls(imagePaths);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation.length, userTyping]);

  useEffect(() => {
    if (!active) return;
    const unread = all.filter((m) => m.sender_id === active && m.receiver_id === adminId && !m.seen).map((m) => m.id);
    if (unread.length) {
      void supabase.from("messages").update({ seen: true, delivered: true }).in("id", unread);
      setAll((prev) => prev.map((m) => (unread.includes(m.id) ? { ...m, seen: true, delivered: true } : m)));
    }
  }, [active, all, adminId]);

  const onPickFile = (f: File | null) => {
    if (!f) { setFile(null); setPreview(null); return; }
    const err = validateImage(f);
    if (err) { toast.error(err); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onTyping = () => {
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { from: adminId } });
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || sending) return;
    if (!text.trim() && !file) return;
    setSending(true);
    try {
      let imagePath: string | null = null;
      if (file) imagePath = await uploadChatImage(adminId, file);
      const payload: any = { sender_id: adminId, receiver_id: active, message: text.trim() || "📎 Image" };
      if (imagePath) payload.image_url = imagePath;
      const { error } = await supabase.from("messages").insert(payload);
      if (error) throw error;
      setText(""); setFile(null); setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const setPaymentStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("messages").update({ payment_status: status }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(`Payment ${status}`);
  };

  const label = (uid: string) => profiles[uid]?.full_name || profiles[uid]?.email || uid.slice(0, 8);

  const lastProductForActive = useMemo(() => {
    if (!active) return undefined;
    const withProduct = conversation.filter((m) => m.product_id);
    const last = withProduct[withProduct.length - 1];
    return last?.product_id ? products[last.product_id] : undefined;
  }, [conversation, products, active]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-4">Support inbox</h1>
      <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[75vh]">
        <aside className="rounded-2xl border bg-card overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-60" /> No messages yet.
            </div>
          ) : (
            threads.map(([uid, t]) => {
              const lastProd = t.last.product_id ? products[t.last.product_id] : undefined;
              return (
                <button key={uid} onClick={() => setActive(uid)} className={`w-full text-left p-3 border-b flex items-center gap-3 hover:bg-accent/50 transition ${active === uid ? "bg-accent" : ""}`}>
                  <div className="h-9 w-9 rounded-full bg-accent grid place-items-center text-xs font-semibold overflow-hidden shrink-0">
                    {profiles[uid]?.avatar_url ? <img src={profiles[uid]!.avatar_url!} alt="" className="h-full w-full object-cover" /> : (label(uid)[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm truncate">{label(uid)}</div>
                      <div className="text-[10px] text-muted-foreground shrink-0">{timeAgo(t.last.created_at)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t.last.sender_id === adminId ? "You: " : ""}
                      {t.last.image_url ? "📷 " : ""}{t.last.message}
                    </div>
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
                  <a href={`/products/${lastProductForActive.id}`} className="hidden md:flex items-center gap-2 rounded-lg border px-2 py-1 text-xs hover:bg-accent">
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
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? "text-white" : "bg-accent text-foreground"}`} style={mine ? { background: "var(--gradient-primary)" } : undefined}>
                        {prod && <ProductChip p={prod} />}
                        {m.image_url && <div className="mb-1"><AttachmentImage path={m.image_url} signed={signed[m.image_url]} /></div>}
                        {m.message && <div className="text-sm px-1 whitespace-pre-wrap break-words">{m.message}</div>}
                        <PaymentStatusBadge status={m.payment_status ?? undefined} />
                        {m.payment_proof && !mine && m.payment_status === "pending" && (
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPaymentStatus(m.id, "approved")}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPaymentStatus(m.id, "rejected")}>
                              <XCircle className="h-3.5 w-3.5 mr-1 text-red-600" /> Reject
                            </Button>
                          </div>
                        )}
                        <div className={`text-[10px] mt-1 px-1 flex items-center gap-1 ${mine ? "text-white/80" : "text-muted-foreground"}`}>
                          <span>{timeAgo(m.created_at)}</span>
                          {mine && (m.seen ? <CheckCheck className="h-3 w-3" /> : m.delivered ? <CheckCheck className="h-3 w-3 opacity-60" /> : <Check className="h-3 w-3 opacity-60" />)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {userTyping && <div className="text-xs text-muted-foreground italic px-2">User is typing…</div>}
                <div ref={bottomRef} />
              </div>

              {preview && (
                <div className="mx-3 mb-2 rounded-xl border bg-background p-2 flex items-center gap-3">
                  <img src={preview} alt="preview" className="h-14 w-14 rounded object-cover" />
                  <div className="flex-1 text-xs truncate">{file?.name}</div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => onPickFile(null)}><X className="h-4 w-4" /></Button>
                </div>
              )}

              <form onSubmit={send} className="p-3 border-t flex gap-2">
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />
                <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()}><ImageIcon className="h-4 w-4" /></Button>
                <Input value={text} onChange={(e) => { setText(e.target.value); onTyping(); }} placeholder="Reply…" />
                <Button type="submit" disabled={sending || (!text.trim() && !file)} className="text-white" style={{ background: "var(--gradient-primary)" }}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}