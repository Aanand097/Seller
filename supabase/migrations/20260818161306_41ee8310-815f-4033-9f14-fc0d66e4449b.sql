REVOKE ALL ON FUNCTION public.get_first_admin_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.notify_admins(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_first_admin_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.notify_admins(text, text) TO authenticated, service_role;