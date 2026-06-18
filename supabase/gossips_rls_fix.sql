-- Sadece gossips RLS hatası için hızlı düzeltme
-- Hata: "new row violates row-level security policy for table gossips"

ALTER TABLE gossips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gossips_select" ON gossips;
DROP POLICY IF EXISTS "gossips_insert" ON gossips;
DROP POLICY IF EXISTS "gossips_update" ON gossips;
DROP POLICY IF EXISTS "gossips_update_engagement" ON gossips;

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
