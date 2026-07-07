import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; status: string; paymentStatus?: string; accountDetails?: string }) => {
    const allowed = ["pending", "processing", "delivered", "cancelled", "archived", "scam_review"];
    const paymentAllowed = ["pending", "paid", "failed", "refunded"];
    if (!d?.orderId || !allowed.includes(d.status)) throw new Error("Invalid input");
    if (d.paymentStatus && !paymentAllowed.includes(d.paymentStatus)) throw new Error("Invalid payment status");
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

    const updates: any = { delivery_status: data.status };
    if (data.paymentStatus) updates.payment_status = data.paymentStatus;
    if (typeof data.accountDetails === "string") updates.account_details = data.accountDetails.trim() || null;
    if (data.status === "delivered") updates.delivered_at = new Date().toISOString();

    const { data: order, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", data.orderId)
      .select("id, user_id, account_details")
      .single();
    if (error || !order) throw new Error(error?.message ?? "Update failed");

    // Caller is an admin — RLS "Admins manage notifications" + "Users send messages"
    // allows these inserts via the authenticated client (no service role required).
    let message = `Your order #${order.id.slice(0, 8)} status was updated to "${data.status}".`;
    if (data.status === "delivered" && order.account_details) {
      message = `Your order #${order.id.slice(0, 8)} has been delivered. Account details are available in your orders page.`;
    }

    await supabase.from("notifications").insert({
      user_id: order.user_id,
      title: `Order ${data.status}`,
      message: message,
    });
    if (data.status === "delivered" && order.account_details) {
      await supabase.from("messages").insert({
        sender_id: userId,
        receiver_id: order.user_id,
        order_id: order.id,
        message: `Your order #${order.id.slice(0, 8)} is delivered. Account details:\n${order.account_details}`,
      });
    }
    return { ok: true };
  });
