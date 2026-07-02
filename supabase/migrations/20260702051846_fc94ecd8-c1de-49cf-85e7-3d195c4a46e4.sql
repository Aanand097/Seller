ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS account_details text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS payment_proof_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS messages_order_id_idx ON public.messages(order_id);
CREATE INDEX IF NOT EXISTS messages_sender_receiver_created_idx ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_receiver_seen_idx ON public.messages(receiver_id, seen, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON public.orders(user_id, created_at DESC);

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DROP POLICY IF EXISTS "Recipients update seen" ON public.messages;
CREATE POLICY "Participants update message delivery and proof status"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  auth.uid() = receiver_id
  OR auth.uid() = sender_id
  OR private.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = receiver_id
  OR auth.uid() = sender_id
  OR private.has_role(auth.uid(), 'admin'::app_role)
);