ALTER TABLE public.members ADD COLUMN joined_on date;
UPDATE public.members SET joined_on = created_at::date WHERE joined_on IS NULL;

CREATE OR REPLACE FUNCTION public.update_obligation_period(_obligation_id uuid, _year integer, _month integer DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE ob public.subscription_obligations;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _year IS NULL OR _year < 2000 OR _year > 2100 THEN RAISE EXCEPTION 'ஆண்டு சரியில்லை (Invalid year)'; END IF;
  SELECT * INTO ob FROM public.subscription_obligations WHERE id=_obligation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Obligation not found'; END IF;
  IF ob.payment_type='monthly' AND (_month IS NULL OR _month<1 OR _month>12) THEN RAISE EXCEPTION 'மாதம் சரியில்லை (Invalid month)'; END IF;
  IF ob.payment_type='yearly' THEN _month := NULL; END IF;
  IF EXISTS (SELECT 1 FROM public.subscription_obligations WHERE id<>ob.id AND member_id=ob.member_id
     AND payment_type=ob.payment_type AND period_year=_year AND period_month IS NOT DISTINCT FROM _month) THEN
    RAISE EXCEPTION 'இந்த காலத்திற்கு ஏற்கனவே சந்தா உள்ளது (Already exists for this period)'; END IF;
  UPDATE public.subscription_obligations SET period_year=_year, period_month=_month WHERE id=ob.id;
  PERFORM public.write_audit('update_obligation_period','subscription_obligations',ob.id::text,
    jsonb_build_object('from_year',ob.period_year,'from_month',ob.period_month,'year',_year,'month',_month));
END $$;
GRANT EXECUTE ON FUNCTION public.update_obligation_period(uuid,integer,integer) TO authenticated;