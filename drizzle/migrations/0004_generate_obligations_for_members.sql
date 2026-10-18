CREATE OR REPLACE FUNCTION public.generate_obligations_for(_type public.payment_type, _year int, _member_ids uuid[], _month int DEFAULT NULL)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE amt numeric; cnt int;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _type = 'monthly' AND (_month IS NULL OR _month < 1 OR _month > 12) THEN RAISE EXCEPTION 'Invalid month'; END IF;
  IF _member_ids IS NULL OR array_length(_member_ids,1) IS NULL THEN RAISE EXCEPTION 'உறுப்பினர்களைத் தேர்ந்தெடுக்கவும் (Select members)'; END IF;
  SELECT CASE WHEN _type='monthly' THEN monthly_amount ELSE yearly_amount END INTO amt FROM public.app_settings WHERE id=1;
  INSERT INTO public.subscription_obligations (member_id, payment_type, period_month, period_year, amount_due)
  SELECT m.id, _type, CASE WHEN _type='monthly' THEN _month END, _year, amt
  FROM public.members m WHERE m.id = ANY(_member_ids)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  PERFORM public.write_audit('generate_obligations', 'subscription_obligations', NULL,
    jsonb_build_object('type', _type, 'year', _year, 'month', _month, 'members', to_jsonb(_member_ids), 'created', cnt));
  RETURN cnt;
END $$;
REVOKE EXECUTE ON FUNCTION public.generate_obligations_for(public.payment_type,int,uuid[],int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_obligations_for(public.payment_type,int,uuid[],int) TO authenticated;