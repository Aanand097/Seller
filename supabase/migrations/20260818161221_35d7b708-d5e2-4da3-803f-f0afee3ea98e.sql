CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true,
  site_name text NOT NULL DEFAULT 'NextGen E-Learning',
  whatsapp_number text NOT NULL DEFAULT '9716583199',
  contact_email text NOT NULL DEFAULT 'unlimatesubscription00@gmail.com',
  esewa_account_name text NOT NULL DEFAULT 'Aanand Kumar Mandal',
  esewa_account_id text NOT NULL DEFAULT '9707642386',
  tax_percent numeric NOT NULL DEFAULT 0,
  support_note text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id)
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update settings" ON public.site_settings FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.site_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view active plans" ON public.plans FOR SELECT TO anon USING (active);
CREATE POLICY "Users view active plans or admin all" ON public.plans FOR SELECT TO authenticated USING (active OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage plans" ON public.plans FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.plans (name, duration, price, description, sort_order) VALUES
  ('Starter', '1 month', 299, 'Single month access, instant delivery.', 1),
  ('Standard', '3 months', 799, 'Best for regular learners.', 2),
  ('Pro', '6 months', 1399, 'Extended access with priority support.', 3),
  ('Ultimate', '12 months', 2499, 'Full year access, maximum savings.', 4);