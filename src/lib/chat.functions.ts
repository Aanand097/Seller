import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const getSupportAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.user_id) throw new Error("Support admin is not configured yet.");
    return { adminId: data.user_id, userId: context.userId };
  });

const VerifyPaymentInput = z.object({
  messageId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

export const verifyPaymentProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => VerifyPaymentInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: message, error: msgErr } = await supabaseAdmin
      .from("messages")
      .select("id, sender_id, receiver_id, order_id, payment_proof")
      .eq("id", data.messageId)
      .maybeSingle();
    if (msgErr) throw new Error(msgErr.message);
    if (!message?.payment_proof) throw new Error("This message is not a payment proof.");

    const { error: updateMsgErr } = await supabaseAdmin
      .from("messages")
      .update({ payment_status: data.status })
      .eq("id", data.messageId);
    if (updateMsgErr) throw new Error(updateMsgErr.message);

    if (message.order_id) {
      const approved = data.status === "approved";
      const { data: order, error: orderErr } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: approved ? "paid" : "failed",
          delivery_status: approved ? "processing" : "pending",
          payment_verified_at: approved ? new Date().toISOString() : null,
          payment_proof_message_id: data.messageId,
        })
        .eq("id", message.order_id)
        .select("id, user_id")
        .single();
      if (orderErr) throw new Error(orderErr.message);

      await supabaseAdmin.from("notifications").insert({
        user_id: order.user_id,
        title: approved ? "Payment approved" : "Payment rejected",
        message: approved
          ? `Payment for order #${order.id.slice(0, 8)} was approved. Your account delivery is now pending.`
          : `Payment proof for order #${order.id.slice(0, 8)} was rejected. Please upload a clear screenshot again.`,
      });

      await supabaseAdmin.from("messages").insert({
        sender_id: context.userId,
        receiver_id: order.user_id,
        order_id: order.id,
        message: approved
          ? "Payment verified. Your account delivery is pending now."
          : "Payment proof was rejected. Please upload a clear payment screenshot again.",
      });
    }

    return { ok: true };
  });