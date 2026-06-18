-- GıyBet: üretim sertleştirme — RLS, şikayet, engelleme, rate limit, push token
-- Supabase → SQL Editor → Run (mevcut kurulumdan sonra)

-- 1) Gossips: sahiplik + soft delete
ALTER TABLE gossips ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE gossips ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS gossips_user_id_idx ON gossips (user_id);
CREATE INDEX IF NOT EXISTS gossips_deleted_at_idx ON gossips (deleted_at) WHERE deleted_at IS NULL;

-- 2) İçerik şikayetleri
CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id),
  reporter_username text NOT NULL,
  gossip_id text NOT NULL,
  reported_username text,
  reason text NOT NULL DEFAULT 'other',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_reports_status_idx ON content_reports (status, created_at DESC);

-- 3) Kullanıcı engelleme
CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_user_id uuid NOT NULL REFERENCES auth.users(id),
  blocker_username text NOT NULL,
  blocked_username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_user_id, blocked_username)
);

-- 4) Push bildirim tokenları
CREATE TABLE IF NOT EXISTS device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'web',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

-- 5) Rate limit + user_id otomatik atama (insert trigger)
CREATE OR REPLACE FUNCTION gossips_before_insert_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_minute int;
  recent_hour int;
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required';
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

DROP TRIGGER IF EXISTS gossips_before_insert_guard ON gossips;
CREATE TRIGGER gossips_before_insert_guard
  BEFORE INSERT ON gossips
  FOR EACH ROW
  EXECUTE FUNCTION gossips_before_insert_guard();

-- 6) Engagement güncelleme RPC (herkes beğeni/ifade güncelleyebilir, içerik değil)
CREATE OR REPLACE FUNCTION update_gossip_engagement(
  p_gossip_id text,
  p_like_usernames jsonb DEFAULT NULL,
  p_reaction_counts jsonb DEFAULT NULL,
  p_user_reactions jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  UPDATE gossips
  SET
    like_usernames = COALESCE(p_like_usernames, like_usernames),
    reaction_counts = COALESCE(p_reaction_counts, reaction_counts),
    user_reactions = COALESCE(p_user_reactions, user_reactions)
  WHERE id::text = p_gossip_id
    AND deleted_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION update_gossip_engagement(text, jsonb, jsonb, jsonb) TO authenticated;

-- 7) Soft delete RPC (sadece sahip)
CREATE OR REPLACE FUNCTION delete_own_gossip(p_gossip_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  UPDATE gossips
  SET deleted_at = now()
  WHERE id::text = p_gossip_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found_or_not_owner';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_own_gossip(text) TO authenticated;

-- 8) Gossips RLS — sıkılaştırılmış
ALTER TABLE gossips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gossips_select" ON gossips;
DROP POLICY IF EXISTS "gossips_insert" ON gossips;
DROP POLICY IF EXISTS "gossips_update" ON gossips;
DROP POLICY IF EXISTS "gossips_update_own" ON gossips;
DROP POLICY IF EXISTS "gossips_update_engagement" ON gossips;
DROP POLICY IF EXISTS "gossips_delete_own" ON gossips;

CREATE POLICY "gossips_select" ON gossips
  FOR SELECT TO authenticated, anon
  USING (deleted_at IS NULL);

CREATE POLICY "gossips_insert" ON gossips
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "gossips_update_own" ON gossips
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "gossips_delete_own" ON gossips
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 9) content_reports RLS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_reports_insert" ON content_reports;
DROP POLICY IF EXISTS "content_reports_select_own" ON content_reports;

CREATE POLICY "content_reports_insert" ON content_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_user_id = auth.uid());

CREATE POLICY "content_reports_select_own" ON content_reports
  FOR SELECT TO authenticated
  USING (reporter_user_id = auth.uid());

-- 10) user_blocks RLS
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_blocks_select" ON user_blocks;
DROP POLICY IF EXISTS "user_blocks_insert" ON user_blocks;
DROP POLICY IF EXISTS "user_blocks_delete" ON user_blocks;

CREATE POLICY "user_blocks_select" ON user_blocks
  FOR SELECT TO authenticated
  USING (blocker_user_id = auth.uid());

CREATE POLICY "user_blocks_insert" ON user_blocks
  FOR INSERT TO authenticated
  WITH CHECK (blocker_user_id = auth.uid());

CREATE POLICY "user_blocks_delete" ON user_blocks
  FOR DELETE TO authenticated
  USING (blocker_user_id = auth.uid());

-- 11) device_tokens RLS
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_tokens_select" ON device_tokens;
DROP POLICY IF EXISTS "device_tokens_insert" ON device_tokens;
DROP POLICY IF EXISTS "device_tokens_delete" ON device_tokens;

CREATE POLICY "device_tokens_select" ON device_tokens
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "device_tokens_insert" ON device_tokens
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "device_tokens_delete" ON device_tokens
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 12) Realtime: Supabase Dashboard → Database → Replication → gossip_chat_messages, notifications
