DROP POLICY IF EXISTS "settings read" ON public.app_settings;
CREATE POLICY "settings read admins" ON public.app_settings FOR SELECT TO authenticated USING (public.is_active_admin());