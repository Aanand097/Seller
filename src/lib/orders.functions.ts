import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
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
      .insert({ user_id: userId, total_price: total, payment_status: "paid", delivery_status: "pending" })
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
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: "Order confirmed",
      message: `Your order #${shortId} for ${titles} has been placed. We will notify you when it is delivered.`,
    });

    const { data: admins } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    if (admins && admins.length > 0) {
      await supabaseAdmin.from("notifications").insert(
        admins.map((a) => ({
          user_id: a.user_id,
          title: "New order received",
          message: `Order #${shortId} placed for ${titles} (total $${total.toFixed(2)}).`,
        })),
      );
    }

    return { orderId: order.id };
  });