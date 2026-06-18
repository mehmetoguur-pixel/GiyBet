-- GıyBet: Türkiye 81 il örnek gıybet + yorum seed
-- Supabase → SQL Editor → yapıştır → Run
-- Not: Mevcut verileri silmez; yeni satırlar ekler.

DO $$
DECLARE
  r RECORD;
  gid uuid;
  gossip_text text;
  gossip_author text;
  lat_jitter double precision;
  lng_jitter double precision;
  i int;
  j int;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('Adana', 37, 35.3213),
      ('Adıyaman', 37.7648, 38.2786),
      ('Afyonkarahisar', 38.7638, 30.5403),
      ('Ağrı', 39.7191, 43.0503),
      ('Amasya', 40.6539, 35.8331),
      ('Ankara', 39.9334, 32.8597),
      ('Antalya', 36.8969, 30.7133),
      ('Artvin', 41.1828, 41.8183),
      ('Aydın', 37.8444, 27.8458),
      ('Balıkesir', 39.6484, 27.8826),
      ('Bilecik', 40.1426, 29.9793),
      ('Bingöl', 38.8853, 40.4983),
      ('Bitlis', 38.4006, 42.1095),
      ('Bolu', 40.735, 31.6061),
      ('Burdur', 37.7203, 30.2908),
      ('Bursa', 40.1826, 29.0669),
      ('Çanakkale', 40.1553, 26.4142),
      ('Çankırı', 40.6013, 33.6134),
      ('Çorum', 40.5506, 34.9556),
      ('Denizli', 37.7765, 29.0864),
      ('Diyarbakır', 37.9144, 40.2306),
      ('Edirne', 41.6771, 26.5557),
      ('Elazığ', 38.681, 39.2264),
      ('Erzincan', 39.75, 39.5),
      ('Erzurum', 39.9043, 41.2679),
      ('Eskişehir', 39.7767, 30.5206),
      ('Gaziantep', 37.0662, 37.3833),
      ('Giresun', 40.9128, 38.3895),
      ('Gümüşhane', 40.4603, 39.4814),
      ('Hakkari', 37.5744, 43.7408),
      ('Hatay', 36.4018, 36.3498),
      ('Isparta', 37.7648, 30.5566),
      ('Mersin', 36.8121, 34.6415),
      ('İstanbul', 41.0082, 28.9784),
      ('İzmir', 38.4237, 27.1428),
      ('Kars', 40.6013, 43.0975),
      ('Kastamonu', 41.3887, 33.7827),
      ('Kayseri', 38.7312, 35.4787),
      ('Kırklareli', 41.7333, 27.2167),
      ('Kırşehir', 39.1425, 34.1709),
      ('Kocaeli', 40.7654, 29.9408),
      ('Konya', 37.8746, 32.4932),
      ('Kütahya', 39.4242, 29.9833),
      ('Malatya', 38.3552, 38.3095),
      ('Manisa', 38.6191, 27.4289),
      ('Kahramanmaraş', 37.5858, 36.9371),
      ('Mardin', 37.3212, 40.7245),
      ('Muğla', 37.2153, 28.3636),
      ('Muş', 38.7432, 41.5065),
      ('Nevşehir', 38.6244, 34.7239),
      ('Niğde', 37.9667, 34.6833),
      ('Ordu', 40.9839, 37.8764),
      ('Rize', 41.0201, 40.5234),
      ('Sakarya', 40.7569, 30.3781),
      ('Samsun', 41.2867, 36.33),
      ('Siirt', 37.9333, 41.95),
      ('Sinop', 42.0269, 35.1551),
      ('Sivas', 39.7477, 37.0179),
      ('Tekirdağ', 40.9833, 27.5167),
      ('Tokat', 40.3167, 36.55),
      ('Trabzon', 41.0027, 39.7168),
      ('Tunceli', 39.1079, 39.5401),
      ('Şanlıurfa', 37.1591, 38.7969),
      ('Uşak', 38.6823, 29.4082),
      ('Van', 38.4891, 43.4089),
      ('Yozgat', 39.82, 34.8044),
      ('Zonguldak', 41.4564, 31.7987),
      ('Aksaray', 38.3687, 34.037),
      ('Bayburt', 40.2552, 40.2249),
      ('Karaman', 37.1759, 33.2287),
      ('Kırıkkale', 39.8468, 33.5153),
      ('Batman', 37.8812, 41.1351),
      ('Şırnak', 37.5164, 42.4611),
      ('Bartın', 41.6344, 32.3375),
      ('Ardahan', 41.1105, 42.7022),
      ('Iğdır', 39.9167, 44.0333),
      ('Yalova', 40.65, 29.2667),
      ('Karabük', 41.2061, 32.6204),
      ('Kilis', 36.7184, 37.1212),
      ('Osmaniye', 37.0742, 36.2478),
      ('Düzce', 40.8438, 31.1565)
    ) AS t(city_name, base_lat, base_lng)
  LOOP
    FOR i IN 1..4 LOOP
      lat_jitter := r.base_lat + (random() - 0.5) * 0.08;
      lng_jitter := r.base_lng + (random() - 0.5) * 0.08;
      gossip_text := r.city_name || ' · ' || (ARRAY[
        'Bizim semtteki o olay hâlâ konuşuluyor...',
        'Kimse ses çıkarmıyor ama herkes biliyor 👀',
        'Dün akşam meydanda dolaşan söylenti şok edici.',
        'Okul/iş çıkışı kahvehanede patlayan gıybet viral oldu.'
      ])[i];
      gossip_author := (ARRAY[
        'gece_kusu','dedikodu_kazani','anonim_kedi','gizli_motorcu',
        'latte_queen','baskent_gizli','ankara_kusu','kuzey_ruh'
      ])[1 + floor(random() * 8)::int];

      INSERT INTO gossips (
        content, city, lat, lng, username,
        like_usernames, reaction_counts, user_reactions
      ) VALUES (
        gossip_text,
        r.city_name,
        lat_jitter,
        lng_jitter,
        gossip_author,
        jsonb_build_array(gossip_author, 'anonim_ruh'),
        jsonb_build_object('fire', floor(random()*4)::int, 'shock', floor(random()*3)::int, 'secret', floor(random()*2)::int),
        jsonb_build_object(gossip_author, (ARRAY['fire','shock','secret'])[1 + floor(random()*3)::int])
      ) RETURNING id INTO gid;

      FOR j IN 1..2 LOOP
        INSERT INTO comments (gossip_id, username, author, content)
        VALUES (
          gid::text,
          (ARRAY['yorumcu_42','mahalle_kusu','sessiz_izleyici','dedikodu_fan'])[j],
          (ARRAY['yorumcu_42','mahalle_kusu','sessiz_izleyici','dedikodu_fan'])[j],
          (ARRAY[
            'Burada da aynısı konuşuluyor 😂',
            'Detay verir misin?',
            'Kimse yüzüne söylemiyor ama herkes biliyor.',
            'Az önce kuaförde de aynısını duydum!'
          ])[j]
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
