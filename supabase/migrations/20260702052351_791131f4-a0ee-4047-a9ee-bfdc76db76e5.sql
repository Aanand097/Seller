DROP POLICY IF EXISTS "Users send messages" ON public.messages;

CREATE POLICY "Users send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (
    order_id IS NULL
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = messages.order_id
        AND o.user_id = auth.uid()
    )
  )
);