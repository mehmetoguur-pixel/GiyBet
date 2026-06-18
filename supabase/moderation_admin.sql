-- GıyBet: moderasyon genişletme — admin notu, kullanıcı ban, bildirim altyapısı
-- Supabase → SQL Editor → production_hardening.sql sonrası çalıştır

-- 1) Şikayetlere admin alanları
ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS reviewed_by text;

-- 2) Platform ban (admin)
CREATE TABLE IF NOT EXISTS user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  reason text,
  banned_by_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS user_bans_user_id_idx ON user_bans (user_id);

ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_bans_select_own" ON user_bans;
CREATE POLICY "user_bans_select_own" ON user_bans
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 3) Banlı kullanıcı gıybet paylaşamaz
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
    AND deleted_at IS NULL
    AND created_at > now() - interval '1 minute';

  IF recent_minute >= 3 THEN
    RAISE EXCEPTION 'rate_limit_minute';
  END IF;

  SELECT COUNT(*)::int INTO recent_hour
  FROM gossips
  WHERE user_id = NEW.user_id
    AND deleted_at IS NULL
    AND created_at > now() - interval '1 hour';

  IF recent_hour >= 30 THEN
    RAISE EXCEPTION 'rate_limit_hour';
  END IF;

  RETURN NEW;
END;
$$;
