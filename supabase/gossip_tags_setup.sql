-- Gıybet etiketleri (#hashtag) — TT / trending için
ALTER TABLE gossips
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN gossips.tags IS 'Hashtag listesi, örn. {#GıybetKuşu,#Starbucks}';
