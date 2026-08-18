import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { adminPlansQuery, catalogPlansQuery, type Plan } from "@/lib/settings-queries";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/plans")({ component: AdminPlans });

function AdminPlans() {
  const qc = useQueryClient();
  const { data: plans = [], isLoading } = useQuery(adminPlansQuery);
  const [edit, setEdit] = useState<Plan | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: adminPlansQuery.queryKey });
    void qc.invalidateQueries({ queryKey: catalogPlansQuery.queryKey });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const payload = {
      name: fd.get("name") as string,
      duration: fd.get("duration") as string,
      price: Number(fd.get("price")),
      description: ((fd.get("description") as string) || "").trim() || null,
      sort_order: Number(fd.get("sort_order")) || 0,
      active: fd.get("active") === "on",
    };
    setSaving(true);
    const table = supabase.from("plans" as any) as any;
    const res = edit ? await table.update(payload).eq("id", edit.id) : await table.insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Plan saved");
    setOpen(false);
    setEdit(null);
    refresh();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    const { error } = await (supabase.from("plans" as any).delete().eq("id", id) as any);
    if (error) return toast.error(error.message);
    toast.success("Plan deleted");
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Plans</h1>
          <p className="text-muted-foreground mt-1 text-sm">Subscription tiers shown to customers.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEdit(null)} className="text-white" style={{ background: "var(--gradient-primary)" }}><Plus className="h-4 w-4 mr-1" />Add plan</Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-md max-h-[88vh] overflow-y-auto p-3 sm:p-4">
            <DialogHeader className="pb-1"><DialogTitle className="text-lg">{edit ? "Edit" : "New"} plan</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-2.5">
              <div className="space-y-1"><Label className="text-xs">Name</Label><Input name="name" required defaultValue={edit?.name ?? ""} /></div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1"><Label className="text-xs">Duration</Label><Input name="duration" required defaultValue={edit?.duration ?? "1 month"} /></div>
                <div className="space-y-1"><Label className="text-xs">Price</Label><Input name="price" type="number" step="0.01" required defaultValue={edit?.price ?? ""} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea name="description" rows={2} defaultValue={edit?.description ?? ""} /></div>
              <div className="space-y-1"><Label className="text-xs">Sort order</Label><Input name="sort_order" type="number" defaultValue={edit?.sort_order ?? 0} /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={edit ? edit.active : true} /> Active</label>
              <Button type="submit" disabled={saving} className="w-full text-white mt-1" style={{ background: "var(--gradient-primary)" }}>{saving ? "Saving..." : "Save"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-2xl border bg-card divide-y">
        {isLoading && <div className="p-4 text-muted-foreground">Loading...</div>}
        {!isLoading && plans.length === 0 && <div className="p-4 text-muted-foreground">No plans yet.</div>}
        {plans.map((p) => (
          <div key={p.id} className="p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[8rem]">
              <div className="font-semibold">{p.name} {!p.active && <span className="text-xs text-muted-foreground">(hidden)</span>}</div>
              <div className="text-xs text-muted-foreground">{p.duration}{p.description ? ` · ${p.description}` : ""}</div>
            </div>
            <div className="font-semibold">{formatPrice(Number(p.price))}</div>
            <Button size="icon" variant="ghost" onClick={() => { setEdit(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
