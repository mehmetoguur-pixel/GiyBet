-- GıyBet: SQL dosyalarını tekrar çalıştırırken policy/constraint hatalarını önler
-- Hata aldıysan önce bunu çalıştır, sonra security_hardening.sql

DROP POLICY IF EXISTS "gossips_update_own" ON gossips;
DROP POLICY IF EXISTS "content_reports_insert" ON content_reports;
