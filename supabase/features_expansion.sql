-- GıyBet: özellik genişletme paketi
-- user_follows.sql, follow_notifications.sql sonrası çalıştır

-- 1) Bildirim tercihleri
CREATE TABLE IF NOT EXISTS notification_preferences (
  username text PRIMARY KEY,
  mute_like boolean NOT NULL DEFAULT false,
  mute_comment boolean NOT NULL DEFAULT false,
  mute_reaction boolean NOT NULL DEFAULT false,
  mute_follow boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_prefs_select" ON notification_preferences;
DROP POLICY IF EXISTS "notification_prefs_insert" ON notification_preferences;
DROP POLICY IF EXISTS "notification_prefs_update" ON notification_preferences;

CREATE POLICY "notification_prefs_select" ON notification_preferences
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "notification_prefs_insert" ON notification_preferences
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "notification_prefs_update" ON notification_preferences
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 2) Ban itirazları
CREATE TABLE IF NOT EXISTS ban_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS ban_appeals_status_idx ON ban_appeals (status, created_at DESC);

ALTER TABLE ban_appeals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ban_appeals_insert" ON ban_appeals;
CREATE POLICY "ban_appeals_insert" ON ban_appeals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ban_appeals_select_own" ON ban_appeals;
CREATE POLICY "ban_appeals_select_own" ON ban_appeals
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 3) API rate limit (serverless uyumlu)
CREATE TABLE IF NOT EXISTS api_rate_limit_buckets (
  key text PRIMARY KEY,
  count int NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL
);

ALTER TABLE api_rate_limit_buckets ENABLE ROW LEVEL SECURITY;
