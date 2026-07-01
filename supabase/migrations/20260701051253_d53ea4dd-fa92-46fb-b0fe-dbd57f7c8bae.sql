
DROP POLICY IF EXISTS "Users read own chat files" ON storage.objects;
CREATE POLICY "Authenticated read chat files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-uploads');
