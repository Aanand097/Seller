import { motion } from "framer-motion";
import { ShoppingCart, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { buildWhatsAppUrl } from "@/lib/site-config";

export type ProductRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number;
  subscription_duration: string | null;
  featured: boolean;
  category_id: string | null;
  categories?: { name: string } | null;
};

export function ProductCard({ product, index = 0 }: { product: ProductRow; index?: number }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    const { error } = await supabase.from("cart_items").upsert(
      { user_id: user.id, product_id: product.id, quantity: 1 },
      { onConflict: "user_id,product_id" },
    );
    if (error) toast.error(error.message);
    else toast.success(`${product.title} added to cart`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group"
    >
      <div
        role="link"
        tabIndex={0}
        onClick={() => navigate({ to: "/products/$id", params: { id: product.id } })}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate({ to: "/products/$id", params: { id: product.id } });
          }
        }}
        className="block h-full cursor-pointer"
      >
        <div className="h-full rounded-2xl border bg-card overflow-hidden hover-lift relative">
          <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-accent to-white">
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <div className="h-20 w-20 rounded-2xl grid place-items-center text-white" style={{ background: "var(--gradient-primary)" }}>
                  <Sparkles className="h-10 w-10" />
                </div>
              </div>
            )}
            {product.featured && (
              <Badge className="absolute top-3 left-3 text-white border-0" style={{ background: "var(--gradient-primary)" }}>
                ★ Featured
              </Badge>
            )}
            {product.categories?.name && (
              <Badge variant="secondary" className="absolute top-3 right-3 bg-white/90 backdrop-blur">
                {product.categories.name}
              </Badge>
            )}
          </div>
          <div className="p-5 space-y-3">
            <div>
              <h3 className="font-display font-semibold text-lg leading-tight line-clamp-1">{product.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
            </div>
            <div className="flex items-end justify-between pt-2 border-t">
              <div>
                <div className="text-2xl font-bold gradient-text">{formatPrice(Number(product.price))}</div>
                <div className="text-xs text-muted-foreground">/ {product.subscription_duration ?? "subscription"}</div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="outline" onClick={addToCart} aria-label="Add to cart">
                  <ShoppingCart className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate({ to: "/dashboard/chat", search: { product: product.id } as any }); }} aria-label="Chat about this product">
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <a
                  href={buildWhatsAppUrl(`Hi! I'm interested in "${product.title}" (${formatPrice(Number(product.price))}). Can you tell me more?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md border bg-[#25D366] text-white hover:opacity-90"
                  aria-label="Contact on WhatsApp"
                  title="Contact on WhatsApp"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.555-5.338 11.89-11.893 11.89a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}