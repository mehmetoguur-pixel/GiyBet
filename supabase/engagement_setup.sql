-- GıyBet: gossips RLS + beğeni/ifade sütunları + comments
-- Supabase → SQL Editor → yapıştır → Run

-- 1) Gossips: beğeni ve ifade sütunları
ALTER TABLE gossips
  ADD COLUMN IF NOT EXISTS like_usernames jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE gossips
  ADD COLUMN IF NOT EXISTS reaction_counts jsonb NOT NULL DEFAULT '{"fire":0,"shock":0,"secret":0}'::jsonb;

ALTER TABLE gossips
  ADD COLUMN IF NOT EXISTS user_reactions jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) Comments: eksik sütunlar
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS gossip_id text;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS content text DEFAULT '';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS username text;

-- 3) GOSSIPS RLS — okuma, yeni gıybet, beğeni/ifade güncelleme
ALTER TABLE gossips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gossips_select" ON gossips;
DROP POLICY IF EXISTS "gossips_insert" ON gossips;
DROP POLICY IF EXISTS "gossips_update" ON gossips;
DROP POLICY IF EXISTS "gossips_update_engagement" ON gossips;
DROP POLICY IF EXISTS "Enable read access for all users" ON gossips;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON gossips;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON gossips;

CREATE POLICY "gossips_select" ON gossips
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "gossips_insert" ON gossips
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "gossips_update" ON gossips
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4) Comments RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select" ON comments;
DROP POLICY IF EXISTS "comments_insert" ON comments;

CREATE POLICY "comments_select" ON comments
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "comments_insert" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (true);
