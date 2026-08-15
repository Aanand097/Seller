CREATE INDEX IF NOT EXISTS products_status_featured_idx ON public.products (status, featured DESC);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category_id);