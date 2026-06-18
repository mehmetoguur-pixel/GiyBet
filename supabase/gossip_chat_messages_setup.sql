-- GıyBet: paylaşıma özel sohbet mesajları (ÖNCE BUNU ÇALIŞTIRIN)
-- Hata: venue_name null → gossip_chat_messages_setup.sql + room_messages_rls_fix.sql
-- Supabase → SQL Editor → Run

CREATE TABLE IF NOT EXISTS gossip_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gossip_id text NOT NULL,
  author text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gossip_chat_messages_gossip_idx
  ON gossip_chat_messages (gossip_id, created_at ASC);

ALTER TABLE gossip_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gossip_chat_messages_select" ON gossip_chat_messages;
DROP POLICY IF EXISTS "gossip_chat_messages_insert" ON gossip_chat_messages;

CREATE POLICY "gossip_chat_messages_select" ON gossip_chat_messages
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "gossip_chat_messages_insert" ON gossip_chat_messages
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);
