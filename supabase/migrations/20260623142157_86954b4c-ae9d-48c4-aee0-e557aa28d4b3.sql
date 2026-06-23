-- Remove anon execute on has_role; policies that need it still work for authenticated users
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- Split products SELECT policy so anonymous users don't need to execute has_role
DROP POLICY IF EXISTS "Anyone view active products" ON public.products;

CREATE POLICY "Anon view active products"
  ON public.products
  FOR SELECT
  TO anon
  USING (status = 'active');

CREATE POLICY "Users view active or admin all products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));
