import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, Plus, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365; // 1 year (max allowed)
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

function AdminProducts() {
  const [list, setList] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from("products").select("*, categories(name)").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { void load(); void supabase.from("categories").select("*").then(({ data }) => setCats(data ?? [])); }, []);

  useEffect(() => {
    setImageUrl(edit?.image_url ?? null);
  }, [edit, open]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Please pick an image file");
    if (file.size > MAX_IMAGE_BYTES) return toast.error("Image must be 5 MB or smaller");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("product-images")
        .createSignedUrl(path, SIGNED_URL_EXPIRY);
      if (sErr || !signed) throw sErr ?? new Error("Could not get URL");
      setImageUrl(signed.signedUrl);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const payload = {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      image_url: imageUrl,
      category_id: (fd.get("category_id") as string) || null,
      price: Number(fd.get("price")),
      subscription_duration: fd.get("subscription_duration") as string,
      featured: fd.get("featured") === "on",
      status: "active",
    };
    setSaving(true);
    const res = edit ? await supabase.from("products").update(payload).eq("id", edit.id) : await supabase.from("products").insert(payload);
    setSaving(false);
    if (res.error) toast.error(res.error.message);
    else { toast.success("Saved"); setOpen(false); setEdit(null); setImageUrl(null); void load(); }
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
              <div className="space-y-1.5">
                <Label>Product image</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }}
                />
                {imageUrl ? (
                  <div className="relative rounded-lg border overflow-hidden bg-accent/40">
                    <img src={imageUrl} alt="Preview" className="w-full h-40 object-cover" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                        <Upload className="h-4 w-4 mr-1" />Replace
                      </Button>
                      <Button type="button" size="icon" variant="destructive" onClick={() => setImageUrl(null)} aria-label="Remove image">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/60 transition flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground"
                  >
                    <Upload className="h-5 w-5" />
                    {uploading ? "Uploading..." : "Click to upload from device"}
                    <span className="text-xs">PNG, JPG, WebP · up to 5 MB</span>
                  </button>
                )}
              </div>
              <div className="space-y-1.5"><Label>Category</Label>
                <select name="category_id" defaultValue={edit?.category_id ?? ""} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                  <option value="">—</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={edit?.featured} /> Featured</label>
              <Button type="submit" disabled={saving || uploading} className="w-full text-white" style={{ background: "var(--gradient-primary)" }}>
                {saving ? "Saving..." : "Save"}
              </Button>
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