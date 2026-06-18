-- GıyBet: şikayet API insert politikası
-- security_hardening.sql bu politikayı kaldırıyor; /api/reports (JWT yedek) için gerekli
-- production_hardening.sql ve security_hardening.sql sonrası çalıştır

DROP POLICY IF EXISTS "content_reports_insert" ON content_reports;

CREATE POLICY "content_reports_insert" ON content_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_user_id = auth.uid());
