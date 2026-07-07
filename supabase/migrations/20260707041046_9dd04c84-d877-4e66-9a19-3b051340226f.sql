
CREATE OR REPLACE FUNCTION public.get_first_admin_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_first_admin_id() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_admins(_title text, _message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message)
  SELECT user_id, _title, _message
  FROM public.user_roles
  WHERE role = 'admin';
END;
$$;
GRANT EXECUTE ON FUNCTION public.notify_admins(text, text) TO anon, authenticated;
