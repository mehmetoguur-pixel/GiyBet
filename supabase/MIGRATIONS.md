# Supabase SQL migration sırası

Supabase Dashboard → SQL Editor'da aşağıdaki dosyaları **sırayla** çalıştır.

| # | Dosya | Açıklama |
|---|--------|----------|
| 1 | `production_hardening.sql` | Temel tablolar, RLS, gossip rate limit |
| 2 | `engagement_notifications_setup.sql` | Bildirimler, sohbet mesajları |
| 3 | `moderation_admin.sql` | Admin notları, `user_bans`, ban trigger |
| 4 | `security_hardening.sql` | Şikayet rate limit |
| 5 | `realtime_setup.sql` | Realtime publication |
| 6 | `user_follows.sql` | Takip sistemi |
| 7 | `follow_notifications.sql` | `follow` bildirim tipi |
| 8 | `features_expansion.sql` | Bildirim tercihleri, ban itiraz, API rate limit |

Yeni migration eklerken bu listeye satır ekle ve numarayı koru.
