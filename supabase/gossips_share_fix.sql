-- GıyBet: paylaşım insert düzeltmeleri
-- production_hardening.sql ve moderation_admin.sql sonrası çalıştır
-- Trigger deleted_at olmayan şemada insert'i kırıyor; RLS sıkı user_id kontrolü paylaşımı engelleyebilir

CREATE OR REPLACE FUNCTION gossips_before_insert_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_minute int;
  recent_hour int;
  is_banned boolean;
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_bans WHERE user_id = NEW.user_id
  ) INTO is_banned;

  IF is_banned THEN
    RAISE EXCEPTION 'user_banned';
  END IF;

  SELECT COUNT(*)::int INTO recent_minute
  FROM gossips
  WHERE user_id = NEW.user_id
    AND created_at > now() - interval '1 minute';

  IF recent_minute >= 3 THEN
    RAISE EXCEPTION 'rate_limit_minute';
  END IF;

  SELECT COUNT(*)::int INTO recent_hour
  FROM gossips
  WHERE user_id = NEW.user_id
    AND created_at > now() - interval '1 hour';

  IF recent_hour >= 30 THEN
    RAISE EXCEPTION 'rate_limit_hour';
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "gossips_insert" ON gossips;
CREATE POLICY "gossips_insert" ON gossips
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "gossips_select" ON gossips;
CREATE POLICY "gossips_select" ON gossips
  FOR SELECT TO authenticated, anon
  USING (true);
