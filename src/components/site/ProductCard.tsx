import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingCart, MessageCircle, Sparkles } from "lucide-react";
import waIcon from "lucide-react";
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
      <Link to="/products/$id" params={{ id: product.id }} className="block h-full">
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
                <Button size="icon" variant="outline" onClick={(e) => { e.preventDefault(); navigate({ to: "/dashboard/chat" }); }} aria-label="Chat with seller">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}