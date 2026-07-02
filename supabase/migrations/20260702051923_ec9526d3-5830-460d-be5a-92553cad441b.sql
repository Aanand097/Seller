ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'esewa',
  ADD COLUMN IF NOT EXISTS payment_reference text;

CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders(payment_status, created_at DESC);