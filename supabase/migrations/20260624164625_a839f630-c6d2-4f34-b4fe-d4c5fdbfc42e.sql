
-- 1. Create private schema for security helpers (not exposed via PostgREST)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- 2. Recreate has_role inside private schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 3. Replace every policy that referenced public.has_role with private.has_role

-- categories
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- messages
DROP POLICY IF EXISTS "Recipients update seen" ON public.messages;
CREATE POLICY "Recipients update seen" ON public.messages FOR UPDATE TO authenticated
  USING ((auth.uid() = receiver_id) OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users view own messages" ON public.messages;
CREATE POLICY "Users view own messages" ON public.messages FOR SELECT TO authenticated
  USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id) OR private.has_role(auth.uid(), 'admin'));

-- notifications: drop user self-insert policy + recreate admin policy
DROP POLICY IF EXISTS "Users insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins manage notifications" ON public.notifications;
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- order_items: replace existing + add admin update/delete
DROP POLICY IF EXISTS "Users view items of own orders" ON public.order_items;
CREATE POLICY "Users view items of own orders" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Admins update order items" ON public.order_items FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete order items" ON public.order_items FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

-- orders
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'));

-- products
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users view active or admin all products" ON public.products;
CREATE POLICY "Users view active or admin all products" ON public.products FOR SELECT TO authenticated
  USING ((status = 'active') OR private.has_role(auth.uid(), 'admin'));

-- profiles
DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'));

-- user_activities
DROP POLICY IF EXISTS "Users view own activities" ON public.user_activities;
CREATE POLICY "Users view own activities" ON public.user_activities FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'));

-- user_roles
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'));

-- 4. Drop the now-unused public.has_role
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 5. Harden handle_new_user: lock execute down (only the auth trigger should invoke it)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
