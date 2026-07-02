import { supabase } from "@/integrations/supabase/client";

export async function addProductToCart(userId: string, productId: string) {
  const { data: existing, error: readError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (readError) throw readError;

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: Number(existing.quantity || 1) + 1 })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("cart_items").insert({ user_id: userId, product_id: productId, quantity: 1 });
  if (error) throw error;
}

export async function setCartItemQuantity(itemId: string, quantity: number) {
  const next = Math.max(1, Math.min(99, Math.floor(quantity)));
  const { error } = await supabase.from("cart_items").update({ quantity: next }).eq("id", itemId);
  if (error) throw error;
}