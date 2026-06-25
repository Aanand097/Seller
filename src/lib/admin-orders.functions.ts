import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; status: string }) => {
    const allowed = ["pending", "processing", "delivered", "cancelled", "archived", "scam_review"];
    if (!d?.orderId || !allowed.includes(d.status)) throw new Error("Invalid input");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const { data: order, error } = await supabase
      .from("orders")
      .update({ delivery_status: data.status })
      .eq("id", data.orderId)
      .select("id, user_id")
      .single();
    if (error || !order) throw new Error(error?.message ?? "Update failed");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("notifications").insert({
      user_id: order.user_id,
      title: `Order ${data.status}`,
      message: `Your order #${order.id.slice(0, 8)} status was updated to "${data.status}".`,
    });
    return { ok: true };
  });