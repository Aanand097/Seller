DROP POLICY IF EXISTS "Authenticated read chat files" ON storage.objects;

CREATE POLICY "Participants read chat files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-uploads'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE m.image_url = storage.objects.name
        AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
  )
);