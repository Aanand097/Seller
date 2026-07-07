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

    // Route notifications via SECURITY DEFINER RPCs so no service role key is required.
    const shortId = order.id.slice(0, 8);
    const titles = rows.map((r) => r.products!.title).join(", ");

    // Insert own "order placed" notification (RLS allows: auth.uid() = user_id).
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Order placed",
      message: `Your order #${shortId} for ${titles} has been placed. Please upload your eSewa payment screenshot in chat for verification.`,
    });

    // Find the first admin and open a chat thread + notify all admins.
    const { data: adminId } = await supabase.rpc("get_first_admin_id");
    if (adminId) {
      await supabase.from("messages").insert({
        sender_id: userId,
        receiver_id: adminId as unknown as string,
        order_id: order.id,
        message: `Order #${shortId} placed for ${titles}. Payment method: ${data.paymentMethod}. Please verify the payment screenshot.`,
      });
    }
    try {
      await supabase.rpc("notify_admins", {
        _title: "New order received",
        _message: `Order #${shortId} placed for ${titles} via ${data.paymentMethod} (total रु ${total.toFixed(2)}).`,
      });
    } catch { /* non-fatal */ }

    return { orderId: order.id, adminId: (adminId as unknown as string) ?? null };
  });
