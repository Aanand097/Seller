
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS payment_proof boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_status text;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_payment_status_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_payment_status_check
  CHECK (payment_status IS NULL OR payment_status IN ('pending','approved','rejected'));

ALTER TABLE public.messages REPLICA IDENTITY FULL;
