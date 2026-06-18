-- GıyBet: Realtime yayını — gossips, comments, notifications
-- production_hardening.sql ve engagement_notifications_setup.sql sonrası çalıştır
-- Supabase Dashboard → Database → Replication'da tabloların yeşil olduğunu doğrula

ALTER TABLE gossips REPLICA IDENTITY FULL;
ALTER TABLE comments REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'gossips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE gossips;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
