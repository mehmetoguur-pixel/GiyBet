-- GıyBet: takip bildirimleri
-- engagement_notifications_setup.sql ve user_follows.sql sonrası çalıştır

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('like', 'comment', 'reaction', 'follow'));
