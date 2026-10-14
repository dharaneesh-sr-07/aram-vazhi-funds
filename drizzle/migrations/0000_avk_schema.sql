
CREATE TYPE public.app_role AS ENUM ('admin','member');
CREATE TYPE public.member_status AS ENUM ('active','inactive');
CREATE TYPE public.payment_type AS ENUM ('monthly','yearly');

-- MEMBERS
CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE,
  member_code text NOT NULL UNIQUE,
  username text NOT NULL,
  full_name text NOT NULL,
  status public.member_status NOT NULL DEFAULT 'active',
  must_change_password boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[A-Za-z][A-Za-z0-9_]{2,29}$')
);
CREATE UNIQUE INDEX members_username_lower_idx ON public.members (lower(username));
GRANT SELECT ON public.members TO authenticated;
GRANT ALL ON public.members TO service_role;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin') AND EXISTS (
    SELECT 1 FROM public.members WHERE auth_user_id = auth.uid() AND status = 'active')
$$;

CREATE OR REPLACE FUNCTION public.current_member_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.members WHERE auth_user_id = auth.uid() AND status = 'active'
$$;

CREATE POLICY "own role read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_active_admin());
CREATE POLICY "members read" ON public.members FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_active_admin());

-- SETTINGS
CREATE TABLE public.app_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  monthly_amount numeric(12,2) NOT NULL DEFAULT 100,
  yearly_amount numeric(12,2) NOT NULL DEFAULT 300,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.app_settings (id) VALUES (1);
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings read" ON public.app_settings FOR SELECT TO authenticated USING (true);

-- OBLIGATIONS
CREATE TABLE public.subscription_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id),
  payment_type public.payment_type NOT NULL,
  period_month int CHECK (period_month BETWEEN 1 AND 12),
  period_year int NOT NULL CHECK (period_year BETWEEN 2000 AND 2100),
  amount_due numeric(12,2) NOT NULL CHECK (amount_due >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT month_matches_type CHECK (
    (payment_type = 'monthly' AND period_month IS NOT NULL) OR
    (payment_type = 'yearly' AND period_month IS NULL))
);
CREATE UNIQUE INDEX uniq_monthly_ob ON public.subscription_obligations (member_id, period_year, period_month) WHERE payment_type = 'monthly';
CREATE UNIQUE INDEX uniq_yearly_ob ON public.subscription_obligations (member_id, period_year) WHERE payment_type = 'yearly';
GRANT SELECT ON public.subscription_obligations TO authenticated;
GRANT ALL ON public.subscription_obligations TO service_role;
ALTER TABLE public.subscription_obligations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ob read" ON public.subscription_obligations FOR SELECT TO authenticated
  USING (public.is_active_admin() OR member_id = public.current_member_id());

-- RECEIPTS
CREATE TABLE public.subscription_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_code text NOT NULL UNIQUE,
  obligation_id uuid NOT NULL REFERENCES public.subscription_obligations(id),
  amount_paid numeric(12,2) NOT NULL CHECK (amount_paid > 0),
  payment_date date NOT NULL,
  notes text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_receipts TO authenticated;
GRANT ALL ON public.subscription_receipts TO service_role;
ALTER TABLE public.subscription_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rc read" ON public.subscription_receipts FOR SELECT TO authenticated
  USING (public.is_active_admin() OR EXISTS (SELECT 1 FROM public.subscription_obligations o
    WHERE o.id = obligation_id AND o.member_id = public.current_member_id()));

-- MONEY TAKEN
CREATE TABLE public.money_taken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_code text NOT NULL UNIQUE,
  member_id uuid NOT NULL REFERENCES public.members(id),
  taken_date date NOT NULL,
  amount_taken numeric(12,2) NOT NULL CHECK (amount_taken > 0),
  extra_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (extra_amount >= 0),
  total_to_return numeric(12,2) GENERATED ALWAYS AS (amount_taken + extra_amount) STORED,
  notes text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.money_taken TO authenticated;
GRANT ALL ON public.money_taken TO service_role;
ALTER TABLE public.money_taken ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mt read" ON public.money_taken FOR SELECT TO authenticated
  USING (public.is_active_admin() OR member_id = public.current_member_id());

-- MONEY RETURNED
CREATE TABLE public.money_returned (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_code text NOT NULL UNIQUE,
  money_taken_id uuid NOT NULL REFERENCES public.money_taken(id),
  member_id uuid NOT NULL REFERENCES public.members(id),
  amount_returned numeric(12,2) NOT NULL CHECK (amount_returned > 0),
  payment_date date NOT NULL,
  notes text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.money_returned TO authenticated;
GRANT ALL ON public.money_returned TO service_role;
ALTER TABLE public.money_returned ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mr read" ON public.money_returned FOR SELECT TO authenticated
  USING (public.is_active_admin() OR member_id = public.current_member_id());

-- AUDIT
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_name text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit read" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_active_admin());

CREATE OR REPLACE FUNCTION public.write_audit(_action text, _entity text, _entity_id text, _details jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_user_id, actor_name, action, entity, entity_id, details)
  VALUES (auth.uid(), (SELECT full_name FROM public.members WHERE auth_user_id = auth.uid()),
          _action, _entity, _entity_id, COALESCE(_details, '{}'::jsonb));
END $$;
REVOKE EXECUTE ON FUNCTION public.write_audit(text,text,text,jsonb) FROM PUBLIC, anon, authenticated;

-- VIEWS (respect RLS)
CREATE VIEW public.obligation_status WITH (security_invoker = true) AS
SELECT o.id, o.member_id, m.full_name, m.member_code, o.payment_type, o.period_month, o.period_year,
  o.amount_due,
  COALESCE(r.paid, 0)::numeric(12,2) AS amount_paid,
  GREATEST(o.amount_due - COALESCE(r.paid, 0), 0)::numeric(12,2) AS remaining,
  CASE WHEN COALESCE(r.paid,0) >= o.amount_due THEN 'paid'
       WHEN COALESCE(r.paid,0) > 0 THEN 'partial' ELSE 'pending' END AS status,
  r.last_date AS last_payment_date
FROM public.subscription_obligations o
JOIN public.members m ON m.id = o.member_id
LEFT JOIN (SELECT obligation_id, SUM(amount_paid) paid, MAX(payment_date) last_date
           FROM public.subscription_receipts GROUP BY obligation_id) r ON r.obligation_id = o.id;
GRANT SELECT ON public.obligation_status TO authenticated;

CREATE VIEW public.money_taken_status WITH (security_invoker = true) AS
SELECT t.id, t.transaction_code, t.member_id, m.full_name, m.member_code, t.taken_date,
  t.amount_taken, t.extra_amount, t.total_to_return, t.notes, t.created_at,
  COALESCE(r.ret, 0)::numeric(12,2) AS amount_returned,
  (t.total_to_return - COALESCE(r.ret, 0))::numeric(12,2) AS remaining,
  CASE WHEN COALESCE(r.ret,0) >= t.total_to_return THEN 'fully_returned'
       WHEN COALESCE(r.ret,0) > 0 THEN 'partially_returned' ELSE 'active' END AS status
FROM public.money_taken t
JOIN public.members m ON m.id = t.member_id
LEFT JOIN (SELECT money_taken_id, SUM(amount_returned) ret FROM public.money_returned GROUP BY money_taken_id) r
  ON r.money_taken_id = t.id;
GRANT SELECT ON public.money_taken_status TO authenticated;

-- CODE GENERATORS
CREATE OR REPLACE FUNCTION public.next_code(_prefix text, _table text, _col text, _year int)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int; full_prefix text := _prefix || '-' || _year || '-';
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(full_prefix));
  EXECUTE format('SELECT COALESCE(MAX(substring(%I from %L)::int),0) FROM public.%I WHERE %I LIKE %L',
    _col, '(\d+)$', _table, _col, full_prefix || '%') INTO n;
  RETURN full_prefix || lpad((n+1)::text, 4, '0');
END $$;
REVOKE EXECUTE ON FUNCTION public.next_code(text,text,text,int) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.next_member_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('AVK-MEMBER'));
  SELECT COALESCE(MAX(substring(member_code from 4)::int),0) INTO n FROM public.members WHERE member_code ~ '^AVK\d+$';
  RETURN 'AVK' || lpad((n+1)::text, 3, '0');
END $$;
REVOKE EXECUTE ON FUNCTION public.next_member_code() FROM PUBLIC, anon, authenticated;

-- RPC: generate obligations
CREATE OR REPLACE FUNCTION public.generate_obligations(_type public.payment_type, _year int, _month int DEFAULT NULL)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE amt numeric; cnt int;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _type = 'monthly' AND (_month IS NULL OR _month < 1 OR _month > 12) THEN RAISE EXCEPTION 'Invalid month'; END IF;
  SELECT CASE WHEN _type='monthly' THEN monthly_amount ELSE yearly_amount END INTO amt FROM public.app_settings WHERE id=1;
  INSERT INTO public.subscription_obligations (member_id, payment_type, period_month, period_year, amount_due)
  SELECT m.id, _type, CASE WHEN _type='monthly' THEN _month END, _year, amt
  FROM public.members m WHERE m.status = 'active'
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  PERFORM public.write_audit('generate_obligations', 'subscription_obligations', NULL,
    jsonb_build_object('type', _type, 'year', _year, 'month', _month, 'created', cnt));
  RETURN cnt;
END $$;

-- RPC: record subscription payment
CREATE OR REPLACE FUNCTION public.record_subscription_payment(_obligation_id uuid, _amount numeric, _date date, _notes text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ob public.subscription_obligations; paid numeric; code text;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'தொகை சரியில்லை (Invalid amount)'; END IF;
  SELECT * INTO ob FROM public.subscription_obligations WHERE id = _obligation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Obligation not found'; END IF;
  SELECT COALESCE(SUM(amount_paid),0) INTO paid FROM public.subscription_receipts WHERE obligation_id = ob.id;
  IF paid + _amount > ob.amount_due THEN
    RAISE EXCEPTION 'செலுத்த வேண்டிய தொகையை விட அதிகம் (Exceeds remaining ₹%)', ob.amount_due - paid;
  END IF;
  code := public.next_code(CASE WHEN ob.payment_type='monthly' THEN 'AVK-MS' ELSE 'AVK-YS' END,
    'subscription_receipts', 'receipt_code', EXTRACT(YEAR FROM _date)::int);
  INSERT INTO public.subscription_receipts (receipt_code, obligation_id, amount_paid, payment_date, notes, recorded_by)
  VALUES (code, ob.id, _amount, _date, NULLIF(trim(_notes),''), auth.uid());
  PERFORM public.write_audit('record_subscription_payment', 'subscription_receipts', code,
    jsonb_build_object('obligation_id', ob.id, 'member_id', ob.member_id, 'amount', _amount, 'type', ob.payment_type));
  RETURN code;
END $$;

-- RPC: record money taken
CREATE OR REPLACE FUNCTION public.record_money_taken(_member_id uuid, _date date, _amount numeric, _extra numeric, _notes text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE code text;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'தொகை சரியில்லை (Invalid amount)'; END IF;
  IF COALESCE(_extra,0) < 0 THEN RAISE EXCEPTION 'கூடுதல் தொகை சரியில்லை (Invalid extra amount)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.members WHERE id = _member_id AND status='active') THEN
    RAISE EXCEPTION 'உறுப்பினர் செயலில் இல்லை (Member not active)'; END IF;
  code := public.next_code('AVK-MT', 'money_taken', 'transaction_code', EXTRACT(YEAR FROM _date)::int);
  INSERT INTO public.money_taken (transaction_code, member_id, taken_date, amount_taken, extra_amount, notes, recorded_by)
  VALUES (code, _member_id, _date, _amount, COALESCE(_extra,0), NULLIF(trim(_notes),''), auth.uid());
  PERFORM public.write_audit('record_money_taken', 'money_taken', code,
    jsonb_build_object('member_id', _member_id, 'amount', _amount, 'extra', COALESCE(_extra,0)));
  RETURN code;
END $$;

-- RPC: record money returned
CREATE OR REPLACE FUNCTION public.record_money_returned(_money_taken_id uuid, _amount numeric, _date date, _notes text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.money_taken; ret numeric; code text;
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'தொகை சரியில்லை (Invalid amount)'; END IF;
  SELECT * INTO t FROM public.money_taken WHERE id = _money_taken_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  SELECT COALESCE(SUM(amount_returned),0) INTO ret FROM public.money_returned WHERE money_taken_id = t.id;
  IF ret + _amount > t.total_to_return THEN
    RAISE EXCEPTION 'மீதமுள்ள தொகையை விட அதிகம் (Exceeds remaining ₹%)', t.total_to_return - ret;
  END IF;
  code := public.next_code('AVK-MR', 'money_returned', 'return_code', EXTRACT(YEAR FROM _date)::int);
  INSERT INTO public.money_returned (return_code, money_taken_id, member_id, amount_returned, payment_date, notes, recorded_by)
  VALUES (code, t.id, t.member_id, _amount, _date, NULLIF(trim(_notes),''), auth.uid());
  PERFORM public.write_audit('record_money_returned', 'money_returned', code,
    jsonb_build_object('money_taken', t.transaction_code, 'member_id', t.member_id, 'amount', _amount));
  RETURN code;
END $$;

-- RPC: update settings
CREATE OR REPLACE FUNCTION public.update_settings(_monthly numeric, _yearly numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_active_admin() THEN RAISE EXCEPTION 'அனுமதி இல்லை (Not allowed)'; END IF;
  IF _monthly <= 0 OR _yearly <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  UPDATE public.app_settings SET monthly_amount=_monthly, yearly_amount=_yearly, updated_at=now() WHERE id=1;
  PERFORM public.write_audit('update_settings', 'app_settings', '1', jsonb_build_object('monthly', _monthly, 'yearly', _yearly));
END $$;

REVOKE EXECUTE ON FUNCTION public.generate_obligations(public.payment_type,int,int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.record_subscription_payment(uuid,numeric,date,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.record_money_taken(uuid,date,numeric,numeric,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.record_money_returned(uuid,numeric,date,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_settings(numeric,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_obligations(public.payment_type,int,int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_subscription_payment(uuid,numeric,date,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_money_taken(uuid,date,numeric,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_money_returned(uuid,numeric,date,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_settings(numeric,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_member_code() TO service_role;
GRANT EXECUTE ON FUNCTION public.write_audit(text,text,text,jsonb) TO service_role;

-- Seed the 10 member profiles (auth accounts linked during provisioning)
INSERT INTO public.members (member_code, username, full_name) VALUES
 ('AVK001','Dharaneesh','Dharaneesh S'),
 ('AVK002','Sarath','Lakshmana Sarath E'),
 ('AVK003','Ashwin','Ashwin B'),
 ('AVK004','Dravit','Dravit P'),
 ('AVK005','Akhil','Akhil B'),
 ('AVK006','Nithissh','Nithissh S'),
 ('AVK007','Dhivya','Dhivya Prabha E'),
 ('AVK008','Poovisha','Poovisha M'),
 ('AVK009','Riyashini','Riyashini M'),
 ('AVK010','Pranika','Pranika V');
