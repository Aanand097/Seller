
CREATE POLICY "Users upload own chat files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own chat files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-uploads' AND ((storage.foldername(name))[1] = auth.uid()::text OR private.has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Users delete own chat files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
