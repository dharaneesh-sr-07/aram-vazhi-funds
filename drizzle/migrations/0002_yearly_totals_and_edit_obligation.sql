CREATE TABLE public.yearly_totals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL UNIQUE CHECK (year BETWEEN 1990 AND 2200),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  notes text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.yearly_totals TO authenticated;
GRANT ALL ON public.yearly_totals TO service_role;
ALTER TABLE public.yearly_totals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "yt read" ON public.yearly_totals FOR SELECT TO authenticated USING (public.is_active_admin());
CREATE POLICY "yt insert" ON public.yearly_totals FOR INSERT TO authenticated WITH CHECK (public.is_active_admin());
CREATE POLICY "yt update" ON public.yearly_totals FOR UPDATE TO authenticated USING (public.is_active_admin()) WITH CHECK (public.is_active_admin());
CREATE POLICY "yt delete" ON public.yearly_totals FOR DELETE TO authenticated USING (public.is_active_admin());

CREATE OR REPLACE FUNCTION public.update_obligation_amount(_obligation_id uuid, _amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE paid numeric;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'தொகை சரியில்லை (Invalid amount)'; END IF;
  PERFORM 1 FROM public.subscription_obligations WHERE id=_obligation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Obligation not found'; END IF;
  SELECT COALESCE(SUM(amount_paid),0) INTO paid FROM public.subscription_receipts WHERE obligation_id=_obligation_id;
  IF _amount < paid THEN RAISE EXCEPTION 'செலுத்திய தொகையை விட குறைவு (Less than paid ₹%)', paid; END IF;
  UPDATE public.subscription_obligations SET amount_due=_amount WHERE id=_obligation_id;
  PERFORM public.write_audit('update_obligation_amount','subscription_obligations',_obligation_id::text, jsonb_build_object('amount',_amount));
END $$;
REVOKE ALL ON FUNCTION public.update_obligation_amount(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_obligation_amount(uuid, numeric) TO authenticated;