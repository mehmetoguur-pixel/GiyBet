-- GıyBet: ek güvenlik — şikayet kısıtları, doğrudan client insert engeli
-- moderation_admin.sql ve production_hardening.sql sonrası çalıştır

-- 1) Aynı gönderiye tekrar şikayet engeli
CREATE UNIQUE INDEX IF NOT EXISTS content_reports_reporter_gossip_unique
  ON content_reports (reporter_user_id, gossip_id);

-- 2) Şikayet nedeni kısıtı
ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS content_reports_reason_check;
ALTER TABLE content_reports ADD CONSTRAINT content_reports_reason_check
  CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'other'));

-- 3) Şikayet rate limit (saatte 10)
CREATE OR REPLACE FUNCTION content_reports_before_insert_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_hour int;
BEGIN
  SELECT COUNT(*)::int INTO recent_hour
  FROM content_reports
  WHERE reporter_user_id = NEW.reporter_user_id
    AND created_at > now() - interval '1 hour';

  IF recent_hour >= 10 THEN
    RAISE EXCEPTION 'report_rate_limit_hour';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_reports_before_insert_guard ON content_reports;
CREATE TRIGGER content_reports_before_insert_guard
  BEFORE INSERT ON content_reports
  FOR EACH ROW
  EXECUTE FUNCTION content_reports_before_insert_guard();

-- 4) Şikayetler yalnızca sunucu API (service_role) üzerinden — client insert kapalı
DROP POLICY IF EXISTS "content_reports_insert" ON content_reports;

-- 5) Kullanıcı kendi şikayetlerini okuyabilir (geçmiş için)
-- content_reports_select_own policy production_hardening.sql'de kalır
