-- GıyBet: bildirimler + paylaşıma özel sohbet mesajları
-- Supabase → SQL Editor → yapıştır → Run
-- Hata: column "gossip_id" does not exist → bu dosya eksik sütunları ekler

-- 1) rooms tablosuna gossip_id
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS gossip_id text;

-- 2) notifications tablosu
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_username text NOT NULL,
  actor_username text NOT NULL,
  gossip_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'reaction')),
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tablo eski yapıda oluşturulmuşsa eksik sütunları ekle
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_username text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_username text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS gossip_id text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 3) room_messages tablosu
CREATE TABLE IF NOT EXISTS room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gossip_id text NOT NULL,
  author text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Eski room_messages (gossip_id olmadan) varsa sütunları ekle
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS gossip_id text;
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 4) İndeksler (sütunlar eklendikten sonra)
DROP INDEX IF EXISTS notifications_recipient_idx;
CREATE INDEX notifications_recipient_idx
  ON notifications (recipient_username, created_at DESC);

DROP INDEX IF EXISTS room_messages_gossip_idx;
CREATE INDEX room_messages_gossip_idx
  ON room_messages (gossip_id, created_at ASC);

-- 5) RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "room_messages_select" ON room_messages;
DROP POLICY IF EXISTS "room_messages_insert" ON room_messages;

CREATE POLICY "room_messages_select" ON room_messages
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "room_messages_insert" ON room_messages
  FOR INSERT TO authenticated, anon WITH CHECK (true);

-- 6) rooms RLS — gıybet paylaşırken sohbet odası oluşturma
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
