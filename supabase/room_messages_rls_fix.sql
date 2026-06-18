-- GıyBet: sohbet mesajı kaydedilemiyorsa (room_id NOT NULL vb.)
-- Supabase → SQL Editor → Run

-- Eski room_messages: venue_name zorunluluğunu kaldır
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_messages' AND column_name = 'venue_name'
  ) THEN
    ALTER TABLE room_messages ALTER COLUMN venue_name DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS gossip_id text;
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS room_id text;
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Eski şemada room_id zorunlu olabilir; gossip_id ile de kayıt yapılabilsin
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'room_messages' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE room_messages ALTER COLUMN room_id DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "room_messages_select" ON room_messages;
DROP POLICY IF EXISTS "room_messages_insert" ON room_messages;
DROP POLICY IF EXISTS "Enable read access for all users" ON room_messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON room_messages;

CREATE POLICY "room_messages_select" ON room_messages
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "room_messages_insert" ON room_messages
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

DROP INDEX IF EXISTS room_messages_gossip_idx;
CREATE INDEX IF NOT EXISTS room_messages_gossip_idx
  ON room_messages (gossip_id, created_at ASC);

DROP INDEX IF EXISTS room_messages_room_idx;
CREATE INDEX IF NOT EXISTS room_messages_room_idx
  ON room_messages (room_id, created_at ASC);
