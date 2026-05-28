import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({ component: AdminCats });

function AdminCats() {
  const [list, setList] = useState<any[]>([]);
  const [name, setName] = useState("");
  const load = async () => { const { data } = await supabase.from("categories").select("*").order("name"); setList(data ?? []); };
  useEffect(() => { void load(); }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const { error } = await supabase.from("categories").insert({ name });
    if (error) toast.error(error.message); else { setName(""); void load(); }
  };
  const del = async (id: string) => { await supabase.from("categories").delete().eq("id", id); void load(); };
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Categories</h1>
      <form onSubmit={add} className="flex gap-2 mb-6 max-w-md">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" />
        <Button type="submit" className="text-white" style={{ background: "var(--gradient-primary)" }}><Plus className="h-4 w-4" /></Button>
      </form>
      <div className="rounded-2xl border bg-card divide-y">
        {list.map((c) => (
          <div key={c.id} className="p-4 flex items-center justify-between"><div className="font-medium">{c.name}</div><Button size="icon" variant="ghost" onClick={() => del(c.id)}><Trash2 className="h-4 w-4" /></Button></div>
        ))}
      </div>
    </div>
  );
}