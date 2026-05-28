import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

function AdminProducts() {
  const [list, setList] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("products").select("*, categories(name)").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { void load(); void supabase.from("categories").select("*").then(({ data }) => setCats(data ?? [])); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const payload = {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      image_url: (fd.get("image_url") as string) || null,
      category_id: (fd.get("category_id") as string) || null,
      price: Number(fd.get("price")),
      subscription_duration: fd.get("subscription_duration") as string,
      featured: fd.get("featured") === "on",
      status: "active",
    };
    const res = edit ? await supabase.from("products").update(payload).eq("id", edit.id) : await supabase.from("products").insert(payload);
    if (res.error) toast.error(res.error.message); else { toast.success("Saved"); setOpen(false); setEdit(null); void load(); }
  };
  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); void load(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">Products</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => setEdit(null)} className="text-white" style={{ background: "var(--gradient-primary)" }}><Plus className="h-4 w-4 mr-1" />Add product</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{edit ? "Edit" : "New"} product</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input name="title" required defaultValue={edit?.title ?? ""} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea name="description" defaultValue={edit?.description ?? ""} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Price</Label><Input name="price" type="number" step="0.01" required defaultValue={edit?.price ?? ""} /></div>
                <div className="space-y-1.5"><Label>Duration</Label><Input name="subscription_duration" defaultValue={edit?.subscription_duration ?? "1 month"} /></div>
              </div>
              <div className="space-y-1.5"><Label>Image URL</Label><Input name="image_url" defaultValue={edit?.image_url ?? ""} /></div>
              <div className="space-y-1.5"><Label>Category</Label>
                <select name="category_id" defaultValue={edit?.category_id ?? ""} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="">—</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={edit?.featured} /> Featured</label>
              <Button type="submit" className="w-full text-white" style={{ background: "var(--gradient-primary)" }}>Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-2xl border bg-card divide-y">
        {list.map((p) => (
          <div key={p.id} className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-accent grid place-items-center font-bold text-primary">{p.title[0]}</div>
            <div className="flex-1">
              <div className="font-semibold">{p.title}</div>
              <div className="text-xs text-muted-foreground">{p.categories?.name ?? "Uncategorized"}{p.featured && " · ★ Featured"}</div>
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