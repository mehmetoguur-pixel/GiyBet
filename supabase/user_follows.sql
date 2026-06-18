-- GıyBet: kullanıcı takip sistemi (Gıybet adı ile)
-- production_hardening.sql sonrası çalıştır

CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_username text NOT NULL,
  followed_username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_user_id, followed_username),
  CHECK (follower_username <> followed_username)
);

CREATE INDEX IF NOT EXISTS user_follows_follower_idx ON user_follows (follower_user_id);
CREATE INDEX IF NOT EXISTS user_follows_followed_username_idx ON user_follows (followed_username);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_follows_select" ON user_follows;
DROP POLICY IF EXISTS "user_follows_insert" ON user_follows;
DROP POLICY IF EXISTS "user_follows_delete" ON user_follows;

CREATE POLICY "user_follows_select" ON user_follows
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "user_follows_insert" ON user_follows
  FOR INSERT TO authenticated
  WITH CHECK (follower_user_id = auth.uid());

CREATE POLICY "user_follows_delete" ON user_follows
  FOR DELETE TO authenticated
  USING (follower_user_id = auth.uid());
