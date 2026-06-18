-- GıyBet: akışta konum etiketi (Ankara - Yenimahalle)
-- Supabase → SQL Editor → Run

ALTER TABLE gossips ADD COLUMN IF NOT EXISTS location_label text;
ALTER TABLE gossips ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE gossips ADD COLUMN IF NOT EXISTS venue_name text;
