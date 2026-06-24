import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Users, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Customer Reviews — NexusAI" },
      { name: "description", content: "See what our community is saying. Read real customer reviews and share your own feedback." },
      { property: "og:title", content: "Customer Reviews — NexusAI" },
      { property: "og:description", content: "Real feedback from real users of NexusAI." },
    ],
  }),
  component: ReviewsPage,
});

type ReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type Author = { id: string; full_name: string | null; avatar_url: string | null };

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star className={`h-5 w-5 ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewsPage() {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [authors, setAuthors] = useState<Record<string, Author>>({});
  const [userCount, setUserCount] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: rv }, { count }] = await Promise.all([
      supabase.from("reviews").select("id,user_id,rating,comment,created_at").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);
    const list = (rv ?? []) as ReviewRow[];
    setReviews(list);
    setUserCount(count ?? 0);
    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length) {
      const { data: pf } = await supabase.from("profiles").select("id,full_name,avatar_url").in("id", ids);
      const map: Record<string, Author> = {};
      (pf ?? []).forEach((p: any) => { map[p.id] = p; });
      setAuthors(map);
    } else {
      setAuthors({});
    }
  };

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    return { total, avg };
  }, [reviews]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in to leave a review");
    const parsed = z.object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().trim().max(1000).optional(),
    }).safeParse({ rating, comment: comment.trim() || undefined });
    if (!parsed.success) return toast.error("Invalid review");
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      rating,
      comment: parsed.data.comment ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks for your feedback!");
    setComment("");
    setRating(5);
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Review removed");
    void load();
  };

  return (
    <PublicLayout>
      <section className="container mx-auto max-w-4xl px-4 py-16">
        <div className="text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold">Customer Reviews</h1>
          <p className="text-muted-foreground mt-3">What our community thinks of NexusAI</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          <div className="glass rounded-2xl p-6 text-center">
            <Users className="h-6 w-6 mx-auto text-primary" />
            <div className="text-3xl font-bold mt-2">{userCount}</div>
            <div className="text-xs text-muted-foreground">Registered users</div>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <MessageSquare className="h-6 w-6 mx-auto text-primary" />
            <div className="text-3xl font-bold mt-2">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Reviews</div>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <Star className="h-6 w-6 mx-auto text-yellow-400 fill-yellow-400" />
            <div className="text-3xl font-bold mt-2">{stats.avg.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Average rating</div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 mt-10">
          <h2 className="font-display text-xl font-semibold">Share your feedback</h2>
          {user ? (
            <form onSubmit={submit} className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Your rating:</span>
                <Stars value={rating} onChange={setRating} />
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell others about your experience (optional)"
                maxLength={1000}
                rows={4}
              />
              <Button type="submit" disabled={busy} className="text-white" style={{ background: "var(--gradient-primary)" }}>
                {busy ? "Submitting..." : "Submit review"}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              <Link to="/login" className="text-primary font-medium">Sign in</Link> to leave a review.
            </p>
          )}
        </div>

        <div className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold">All feedback ({stats.total})</h2>
          {reviews.length === 0 && (
            <div className="text-sm text-muted-foreground">No reviews yet. Be the first to share!</div>
          )}
          {reviews.map((r) => {
            const a = authors[r.user_id];
            const name = a?.full_name ?? "Anonymous";
            const isOwn = user?.id === r.user_id;
            return (
              <div key={r.id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent grid place-items-center overflow-hidden font-bold text-primary">
                    {a?.avatar_url ? <img src={a.avatar_url} alt="" className="h-full w-full object-cover" /> : name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="font-semibold">{name}</div>
                        <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{r.comment}</p>}
                  </div>
                  {isOwn && (
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)} aria-label="Delete review">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {profile?.full_name === null && user && (
          <p className="text-xs text-muted-foreground mt-6 text-center">
            Tip: set your name in <Link to="/dashboard/profile" className="text-primary">your profile</Link> so reviews show your name.
          </p>
        )}
      </section>
    </PublicLayout>
  );
}