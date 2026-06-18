-- GıyBet: gıybet paylaşımında fotoğraf desteği
-- Supabase → SQL Editor → Run

ALTER TABLE gossips ADD COLUMN IF NOT EXISTS image_url text;

-- Storage: Dashboard → Storage → New bucket → "gossip-images" → Public bucket
-- veya aşağıdaki politikaları bucket oluşturduktan sonra çalıştır:

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('gossip-images', 'gossip-images', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;

-- DROP POLICY IF EXISTS "gossip_images_select" ON storage.objects;
-- DROP POLICY IF EXISTS "gossip_images_insert" ON storage.objects;

-- CREATE POLICY "gossip_images_select" ON storage.objects
--   FOR SELECT TO authenticated, anon
--   USING (bucket_id = 'gossip-images');

-- CREATE POLICY "gossip_images_insert" ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'gossip-images');
