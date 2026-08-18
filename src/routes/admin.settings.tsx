import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { settingsQuery, type SiteSettings } from "@/lib/settings-queries";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

const EMPTY: Omit<SiteSettings, "id"> = {
  site_name: "",
  whatsapp_number: "",
  contact_email: "",
  esewa_account_name: "",
  esewa_account_id: "",
  tax_percent: 0,
  support_note: "",
};

function AdminSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(settingsQuery);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        site_name: data.site_name ?? "",
        whatsapp_number: data.whatsapp_number ?? "",
        contact_email: data.contact_email ?? "",
        esewa_account_name: data.esewa_account_name ?? "",
        esewa_account_id: data.esewa_account_id ?? "",
        tax_percent: Number(data.tax_percent ?? 0),
        support_note: data.support_note ?? "",
      });
    }
  }, [data]);

  const set = (k: keyof typeof EMPTY, v: string | number) => setForm((f) => ({ ...f, [k]: v as never }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      id: true,
      ...form,
      tax_percent: Number(form.tax_percent) || 0,
      support_note: (form.support_note ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await (supabase.from("site_settings" as any).upsert(payload as any, { onConflict: "id" }) as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
    void qc.invalidateQueries({ queryKey: settingsQuery.queryKey });
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <p className="text-muted-foreground mt-1 mb-6">Store name, contact channels, payment account and tax.</p>
      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : (
        <form onSubmit={save} className="rounded-2xl border bg-card p-5 space-y-4 max-w-2xl">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Site name</Label>
              <Input value={form.site_name} onChange={(e) => set("site_name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Tax (%)</Label>
              <Input type="number" step="0.01" min="0" max="100" value={form.tax_percent} onChange={(e) => set("tax_percent", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp number</Label>
              <Input value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} placeholder="9716583199" />
            </div>
            <div className="space-y-1.5">
              <Label>Contact email</Label>
              <Input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>eSewa account name</Label>
              <Input value={form.esewa_account_name} onChange={(e) => set("esewa_account_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>eSewa ID</Label>
              <Input value={form.esewa_account_id} onChange={(e) => set("esewa_account_id", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Support note</Label>
            <Textarea rows={3} value={form.support_note ?? ""} onChange={(e) => set("support_note", e.target.value)} placeholder="Shown to customers on checkout / support areas." />
          </div>
          <Button type="submit" disabled={saving} className="text-white" style={{ background: "var(--gradient-primary)" }}>
            <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save settings"}
          </Button>
        </form>
      )}
    </div>
  );
}
