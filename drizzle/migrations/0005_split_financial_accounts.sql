ALTER TABLE public.members ADD COLUMN IF NOT EXISTS mobile text;

ALTER TABLE public.money_taken ADD COLUMN IF NOT EXISTS taken_year integer GENERATED ALWAYS AS (EXTRACT(YEAR FROM taken_date)::integer) STORED;
ALTER TABLE public.subscription_receipts ADD COLUMN IF NOT EXISTS payment_year integer GENERATED ALWAYS AS (EXTRACT(YEAR FROM payment_date)::integer) STORED;
ALTER TABLE public.money_returned ADD COLUMN IF NOT EXISTS payment_year integer GENERATED ALWAYS AS (EXTRACT(YEAR FROM payment_date)::integer) STORED;

ALTER TABLE public.money_returned ADD COLUMN IF NOT EXISTS principal_returned numeric(12,2);
ALTER TABLE public.money_returned ADD COLUMN IF NOT EXISTS interest_amount numeric(12,2);

WITH allocated AS (
  SELECT r.id,
         r.amount_returned,
         t.amount_taken,
         COALESCE(SUM(r.amount_returned) OVER (
           PARTITION BY r.money_taken_id
           ORDER BY r.payment_date, r.created_at, r.id
           ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
         ), 0) AS prior_returned
  FROM public.money_returned r
  JOIN public.money_taken t ON t.id = r.money_taken_id
)
UPDATE public.money_returned r
SET principal_returned = LEAST(a.amount_returned, GREATEST(a.amount_taken - a.prior_returned, 0)),
    interest_amount = a.amount_returned - LEAST(a.amount_returned, GREATEST(a.amount_taken - a.prior_returned, 0))
FROM allocated a
WHERE r.id = a.id;

ALTER TABLE public.money_returned ALTER COLUMN principal_returned SET DEFAULT 0;
ALTER TABLE public.money_returned ALTER COLUMN principal_returned SET NOT NULL;
ALTER TABLE public.money_returned ALTER COLUMN interest_amount SET DEFAULT 0;
ALTER TABLE public.money_returned ALTER COLUMN interest_amount SET NOT NULL;
ALTER TABLE public.money_returned ADD CONSTRAINT money_returned_split_valid CHECK (
  principal_returned >= 0 AND interest_amount >= 0 AND amount_returned = principal_returned + interest_amount
);

CREATE TABLE public.extra_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_code text NOT NULL UNIQUE,
  member_id uuid REFERENCES public.members(id),
  expense_date date NOT NULL,
  expense_year integer GENERATED ALWAYS AS (EXTRACT(YEAR FROM expense_date)::integer) STORED,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL CHECK (length(trim(description)) > 0),
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.extra_expenses TO authenticated;
GRANT ALL ON public.extra_expenses TO service_role;
ALTER TABLE public.extra_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "extra expenses admin read" ON public.extra_expenses FOR SELECT TO authenticated USING (public.is_active_admin());

CREATE OR REPLACE FUNCTION public.record_money_returned_split(
  _money_taken_id uuid, _principal_amount numeric, _interest_amount numeric, _date date, _notes text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE t public.money_taken; principal_paid numeric; interest_paid numeric; total_paid numeric; code text;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _principal_amount IS NULL OR _interest_amount IS NULL OR _principal_amount < 0 OR _interest_amount < 0 OR _principal_amount + _interest_amount <= 0 THEN
    RAISE EXCEPTION 'திருப்பிய தொகை சரியில்லை (Invalid return amount)';
  END IF;
  SELECT * INTO t FROM public.money_taken WHERE id = _money_taken_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  SELECT COALESCE(SUM(principal_returned),0), COALESCE(SUM(interest_amount),0), COALESCE(SUM(amount_returned),0)
    INTO principal_paid, interest_paid, total_paid
    FROM public.money_returned WHERE money_taken_id = t.id;
  IF principal_paid + _principal_amount > t.amount_taken THEN
    RAISE EXCEPTION 'அசல் தொகையை விட அதிகம் (Exceeds principal remaining ₹%)', t.amount_taken - principal_paid;
  END IF;
  IF interest_paid + _interest_amount > t.extra_amount THEN
    RAISE EXCEPTION 'வட்டி தொகையை விட அதிகம் (Exceeds interest due ₹%)', t.extra_amount - interest_paid;
  END IF;
  IF total_paid + _principal_amount + _interest_amount > t.total_to_return THEN
    RAISE EXCEPTION 'திருப்ப வேண்டிய தொகையை விட அதிகம் (Exceeds remaining ₹%)', t.total_to_return - total_paid;
  END IF;
  code := public.next_code('AVK-MR', 'money_returned', 'return_code', EXTRACT(YEAR FROM _date)::integer);
  INSERT INTO public.money_returned (return_code, money_taken_id, member_id, amount_returned, principal_returned, interest_amount, payment_date, notes, recorded_by)
  VALUES (code, t.id, t.member_id, _principal_amount + _interest_amount, _principal_amount, _interest_amount, _date, NULLIF(trim(_notes),''), auth.uid());
  PERFORM public.write_audit('record_money_returned', 'money_returned', code,
    jsonb_build_object('money_taken', t.transaction_code, 'member_id', t.member_id, 'principal', _principal_amount, 'interest', _interest_amount));
  RETURN code;
END $$;
REVOKE ALL ON FUNCTION public.record_money_returned_split(uuid,numeric,numeric,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_money_returned_split(uuid,numeric,numeric,date,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_money_returned(_money_taken_id uuid, _amount numeric, _date date, _notes text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE t public.money_taken; principal_paid numeric; principal_part numeric; interest_part numeric;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'தொகை சரியில்லை (Invalid amount)'; END IF;
  SELECT * INTO t FROM public.money_taken WHERE id = _money_taken_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  SELECT COALESCE(SUM(principal_returned),0) INTO principal_paid FROM public.money_returned WHERE money_taken_id = t.id;
  principal_part := LEAST(_amount, GREATEST(t.amount_taken - principal_paid, 0));
  interest_part := _amount - principal_part;
  RETURN public.record_money_returned_split(_money_taken_id, principal_part, interest_part, _date, _notes);
END $$;
REVOKE ALL ON FUNCTION public.record_money_returned(uuid,numeric,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_money_returned(uuid,numeric,date,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_money_taken(
  _money_taken_id uuid, _member_id uuid, _date date, _amount numeric, _extra numeric, _notes text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE t public.money_taken; principal_paid numeric; interest_paid numeric;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _amount IS NULL OR _amount <= 0 OR COALESCE(_extra,0) < 0 THEN RAISE EXCEPTION 'தொகை சரியில்லை (Invalid amount)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.members WHERE id = _member_id) THEN RAISE EXCEPTION 'Member not found'; END IF;
  SELECT * INTO t FROM public.money_taken WHERE id = _money_taken_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  SELECT COALESCE(SUM(principal_returned),0), COALESCE(SUM(interest_amount),0)
    INTO principal_paid, interest_paid FROM public.money_returned WHERE money_taken_id = t.id;
  IF _amount < principal_paid OR COALESCE(_extra,0) < interest_paid THEN
    RAISE EXCEPTION 'திருப்பிய தொகையை விட குறைக்க முடியாது (Cannot reduce below amounts already returned)';
  END IF;
  UPDATE public.money_taken SET member_id = _member_id, taken_date = _date, amount_taken = _amount,
    extra_amount = COALESCE(_extra,0), notes = NULLIF(trim(_notes), '') WHERE id = t.id;
  UPDATE public.money_returned SET member_id = _member_id WHERE money_taken_id = t.id;
  PERFORM public.write_audit('update_money_taken', 'money_taken', t.transaction_code,
    jsonb_build_object('member_id', _member_id, 'amount', _amount, 'extra', _extra));
END $$;
REVOKE ALL ON FUNCTION public.update_money_taken(uuid,uuid,date,numeric,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_money_taken(uuid,uuid,date,numeric,numeric,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_money_taken(_money_taken_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE t public.money_taken;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  SELECT * INTO t FROM public.money_taken WHERE id = _money_taken_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF EXISTS (SELECT 1 FROM public.money_returned WHERE money_taken_id = t.id) THEN
    RAISE EXCEPTION 'திருப்புப் பதிவுகள் உள்ளன; முதலில் அவற்றை நீக்கவும் (Delete returns first)';
  END IF;
  DELETE FROM public.money_taken WHERE id = t.id;
  PERFORM public.write_audit('delete_money_taken', 'money_taken', t.transaction_code, jsonb_build_object('member_id',t.member_id,'amount',t.amount_taken));
END $$;
REVOKE ALL ON FUNCTION public.delete_money_taken(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_money_taken(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_money_returned(
  _money_returned_id uuid, _principal_amount numeric, _interest_amount numeric, _date date, _notes text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.money_returned; t public.money_taken; principal_paid numeric; interest_paid numeric; total_paid numeric;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _principal_amount IS NULL OR _interest_amount IS NULL OR _principal_amount < 0 OR _interest_amount < 0 OR _principal_amount + _interest_amount <= 0 THEN
    RAISE EXCEPTION 'திருப்பிய தொகை சரியில்லை (Invalid return amount)';
  END IF;
  SELECT * INTO r FROM public.money_returned WHERE id = _money_returned_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Return not found'; END IF;
  SELECT * INTO t FROM public.money_taken WHERE id = r.money_taken_id FOR UPDATE;
  SELECT COALESCE(SUM(principal_returned),0), COALESCE(SUM(interest_amount),0), COALESCE(SUM(amount_returned),0)
    INTO principal_paid, interest_paid, total_paid FROM public.money_returned WHERE money_taken_id = t.id AND id <> r.id;
  IF principal_paid + _principal_amount > t.amount_taken OR interest_paid + _interest_amount > t.extra_amount OR total_paid + _principal_amount + _interest_amount > t.total_to_return THEN
    RAISE EXCEPTION 'மீதமுள்ள தொகையை விட அதிகம் (Exceeds remaining principal or interest)';
  END IF;
  UPDATE public.money_returned SET amount_returned = _principal_amount + _interest_amount,
    principal_returned = _principal_amount, interest_amount = _interest_amount,
    payment_date = _date, notes = NULLIF(trim(_notes),'') WHERE id = r.id;
  PERFORM public.write_audit('update_money_returned','money_returned',r.return_code,jsonb_build_object('principal',_principal_amount,'interest',_interest_amount));
END $$;
REVOKE ALL ON FUNCTION public.update_money_returned(uuid,numeric,numeric,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_money_returned(uuid,numeric,numeric,date,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_money_returned(_money_returned_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.money_returned;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  SELECT * INTO r FROM public.money_returned WHERE id = _money_returned_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Return not found'; END IF;
  DELETE FROM public.money_returned WHERE id = r.id;
  PERFORM public.write_audit('delete_money_returned','money_returned',r.return_code,jsonb_build_object('principal',r.principal_returned,'interest',r.interest_amount));
END $$;
REVOKE ALL ON FUNCTION public.delete_money_returned(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_money_returned(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_subscription_receipt(_receipt_id uuid, _amount numeric, _date date, _notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.subscription_receipts; ob public.subscription_obligations; paid numeric;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'தொகை சரியில்லை (Invalid amount)'; END IF;
  SELECT * INTO r FROM public.subscription_receipts WHERE id = _receipt_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Receipt not found'; END IF;
  SELECT * INTO ob FROM public.subscription_obligations WHERE id = r.obligation_id FOR UPDATE;
  SELECT COALESCE(SUM(amount_paid),0) INTO paid FROM public.subscription_receipts WHERE obligation_id = ob.id AND id <> r.id;
  IF paid + _amount > ob.amount_due THEN RAISE EXCEPTION 'செலுத்த வேண்டிய தொகையை விட அதிகம் (Exceeds due amount)'; END IF;
  UPDATE public.subscription_receipts SET amount_paid = _amount, payment_date = _date, notes = NULLIF(trim(_notes),'') WHERE id = r.id;
  PERFORM public.write_audit('update_subscription_receipt','subscription_receipts',r.receipt_code,jsonb_build_object('amount',_amount,'date',_date));
END $$;
REVOKE ALL ON FUNCTION public.update_subscription_receipt(uuid,numeric,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_subscription_receipt(uuid,numeric,date,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_subscription_receipt(_receipt_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.subscription_receipts;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  SELECT * INTO r FROM public.subscription_receipts WHERE id = _receipt_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Receipt not found'; END IF;
  DELETE FROM public.subscription_receipts WHERE id = r.id;
  PERFORM public.write_audit('delete_subscription_receipt','subscription_receipts',r.receipt_code,jsonb_build_object('amount',r.amount_paid,'obligation_id',r.obligation_id));
END $$;
REVOKE ALL ON FUNCTION public.delete_subscription_receipt(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_subscription_receipt(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_extra_expense(_member_id uuid, _date date, _amount numeric, _description text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE code text;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _amount IS NULL OR _amount <= 0 OR NULLIF(trim(_description),'') IS NULL THEN RAISE EXCEPTION 'செலவு விவரம் சரியில்லை (Invalid expense)'; END IF;
  IF _member_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.members WHERE id = _member_id) THEN RAISE EXCEPTION 'Member not found'; END IF;
  code := public.next_code('AVK-EX','extra_expenses','expense_code',EXTRACT(YEAR FROM _date)::integer);
  INSERT INTO public.extra_expenses (expense_code,member_id,expense_date,amount,description,recorded_by)
  VALUES (code,_member_id,_date,_amount,trim(_description),auth.uid());
  PERFORM public.write_audit('record_extra_expense','extra_expenses',code,jsonb_build_object('member_id',_member_id,'amount',_amount));
  RETURN code;
END $$;
REVOKE ALL ON FUNCTION public.record_extra_expense(uuid,date,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_extra_expense(uuid,date,numeric,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_extra_expense(_expense_id uuid, _member_id uuid, _date date, _amount numeric, _description text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE e public.extra_expenses;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _amount IS NULL OR _amount <= 0 OR NULLIF(trim(_description),'') IS NULL THEN RAISE EXCEPTION 'செலவு விவரம் சரியில்லை (Invalid expense)'; END IF;
  IF _member_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.members WHERE id = _member_id) THEN RAISE EXCEPTION 'Member not found'; END IF;
  SELECT * INTO e FROM public.extra_expenses WHERE id = _expense_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Expense not found'; END IF;
  UPDATE public.extra_expenses SET member_id = _member_id, expense_date = _date, amount = _amount, description = trim(_description) WHERE id = e.id;
  PERFORM public.write_audit('update_extra_expense','extra_expenses',e.expense_code,jsonb_build_object('member_id',_member_id,'amount',_amount));
END $$;
REVOKE ALL ON FUNCTION public.update_extra_expense(uuid,uuid,date,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_extra_expense(uuid,uuid,date,numeric,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_extra_expense(_expense_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE e public.extra_expenses;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  SELECT * INTO e FROM public.extra_expenses WHERE id = _expense_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Expense not found'; END IF;
  DELETE FROM public.extra_expenses WHERE id = e.id;
  PERFORM public.write_audit('delete_extra_expense','extra_expenses',e.expense_code,jsonb_build_object('amount',e.amount));
END $$;
REVOKE ALL ON FUNCTION public.delete_extra_expense(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_extra_expense(uuid) TO authenticated;
