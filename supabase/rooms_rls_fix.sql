-- GıyBet: rooms tablosu RLS düzeltmesi
-- Hata: new row violates row-level security policy for table "rooms"
-- Supabase → SQL Editor → Run

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rooms_select" ON rooms;
DROP POLICY IF EXISTS "rooms_insert" ON rooms;
DROP POLICY IF EXISTS "rooms_update" ON rooms;
DROP POLICY IF EXISTS "Enable read access for all users" ON rooms;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON rooms;

CREATE POLICY "rooms_select" ON rooms
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "rooms_insert" ON rooms
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "rooms_update" ON rooms
  FOR UPDATE TO authenticated, anon
  USING (true)
  WITH CHECK (true);
