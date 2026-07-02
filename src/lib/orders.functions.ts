import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PlaceOrderInput = z.object({
  paymentMethod: z.enum(["esewa", "manual"]).default("esewa"),
  paymentReference: z.string().trim().max(120).optional(),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PlaceOrderInput.parse(input ?? { paymentMethod: "esewa" }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: cart, error: cartErr } = await supabase
      .from("cart_items")
      .select("product_id, quantity, products(id, title, price, status)")
      .eq("user_id", userId);
    if (cartErr) throw new Error(cartErr.message);
    if (!cart || cart.length === 0) throw new Error("Your cart is empty.");

    type Row = { product_id: string; quantity: number; products: { id: string; title: string; price: number; status: string } | null };
    const rows = cart as unknown as Row[];
    for (const r of rows) {
      if (!r.products || r.products.status !== "active") {
        throw new Error(`A product in your cart is no longer available.`);
      }
    }
    const total = rows.reduce((s, r) => s + Number(r.products!.price) * r.quantity, 0);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_price: total,
        payment_status: "pending",
        delivery_status: "pending",
        payment_method: data.paymentMethod,
        payment_reference: data.paymentReference || null,
      })
      .select()
      .single();
    if (orderErr || !order) throw new Error(orderErr?.message ?? "Order failed");

    const items = rows.map((r) => ({
      order_id: order.id,
      product_id: r.product_id,
      price: r.products!.price,
      quantity: r.quantity,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(items);
    if (itemsErr) throw new Error(itemsErr.message);

    await supabase.from("cart_items").delete().eq("user_id", userId);

    // Use admin client to write notifications (RLS: only admins can insert).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const shortId = order.id.slice(0, 8);
    const titles = rows.map((r) => r.products!.title).join(", ");
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .order("created_at", { ascending: true });
    const adminId = admins?.[0]?.user_id ?? null;

    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: "Order placed",
      message: `Your order #${shortId} for ${titles} has been placed. Please upload your eSewa payment screenshot in chat for verification.`,
    });

    if (adminId) {
      await supabaseAdmin.from("messages").insert({
        sender_id: userId,
        receiver_id: adminId,
        order_id: order.id,
        message: `Order #${shortId} placed for ${titles}. Payment method: ${data.paymentMethod}. Please verify the payment screenshot.`,
      });
      await supabaseAdmin.from("notifications").insert(
        (admins ?? []).map((a: { user_id: string }) => ({
          user_id: a.user_id,
          title: "New order received",
          message: `Order #${shortId} placed for ${titles} via ${data.paymentMethod} (total रु ${total.toFixed(2)}).`,
        })),
      );
    }

    return { orderId: order.id, adminId };
  });
