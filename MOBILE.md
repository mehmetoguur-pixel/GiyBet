# GıyBet — Android APK (Detaylı Rehber)

GıyBet bir **Next.js web uygulaması**. APK, Capacitor ile bu siteyi **native Android uygulaması** gibi açar. Telefondaki uygulama aslında senin **canlı web sitene** bağlanır; bu yüzden önce siteyi internete yayınlaman gerekir.

---

## Hızlı başlangıç (3 komut)

Canlı site: **https://giy-bet.vercel.app** (APK varsayılan olarak buraya bağlanır)

```bash
npm run android:prepare    # Capacitor sync + URL doğrulama
npm run android:apk        # Debug APK (Java/Android Studio gerekir)
```

APK dosyası:

`android\app\build\outputs\apk\debug\GiyBet-v1.1.0-debug.apk`

(Versiyon değişince dosya adındaki `1.1.0` da güncellenir.)

Telefona kopyala → yükle → “Bilinmeyen kaynaklardan yükleme” izni ver.

**Android Studio yoksa:** `npm run cap:android` → Build → Build APK(s).

**Play Store için:** imzalı release APK/AAB (Bölüm F).

---

## Büyük resim

```
[Vercel’de canlı site]  ←── APK içindeki WebView buraya bağlanır
        ↑
   Supabase, API’ler burada çalışır

[Bilgisayar] → android:sync → [Android Studio] → APK dosyası → Telefon
```

---

## Bölüm A — Hazırlık (bir kez)

### A1. Bilgisayarda olması gerekenler

| Yazılım | Neden |
|---------|--------|
| **Node.js** (v18+) | `npm`, proje komutları |
| **Git** | Vercel’e repo göndermek için (GitHub) |
| **Android Studio** | APK derlemek için |
| **Java JDK 17** | Android Studio genelde kendi JDK’sını kurar |

### A2. Android Studio kurulumu

1. [https://developer.android.com/studio](https://developer.android.com/studio) → indir (Windows).
2. Kurulumda varsayılanları kabul et.
3. İlk açılışta **Standard** kurulum seç.
4. SDK indirme bitsin (birkaç dakika sürebilir).
5. Üst menü: **More Actions** → **SDK Manager** (veya **Settings** → **Languages & Frameworks** → **Android SDK**).
6. **SDK Platforms** sekmesi → **Android 14.0 (API 34)** veya **Android 13 (API 33)** işaretli olsun.
7. **SDK Tools** sekmesi → **Android SDK Build-Tools**, **Android SDK Platform-Tools** işaretli olsun → **Apply**.

---

## Bölüm B — Web’i internete yayınla (zorunlu)

APK tek başına sunucu değil; **Vercel’de çalışan siteye** ihtiyaç duyar (mekan arama API’leri, giriş vb.).

### B1. Projeyi GitHub’a yükle (henüz yoksa)

1. [github.com](https://github.com) → yeni repo: `GiyBet` (private veya public).
2. Bilgisayarda proje klasöründe:

```powershell
cd "C:\Users\Mehmet OĞUR\Desktop\GiyBet"
git init
git add .
git commit -m "GıyBet ilk sürüm"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/GiyBet.git
git push -u origin main
```

`.env.local` commit edilmez (`.gitignore`’da) — doğru.

### B2. Vercel deploy

1. [vercel.com](https://vercel.com) → giriş (GitHub ile).
2. **Add New** → **Project**.
3. **Import** → `GiyBet` reposunu seç.
4. Framework: **Next.js** (otomatik algılanır).
5. **Environment Variables** ekle:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `NEXT_PUBLIC_TOMTOM_KEY` | (opsiyonel) mekan arama için |

6. **Deploy** → 1–3 dakika bekle.
7. Yeşil **Visit** → site açılır. Adres örneği: `https://giybet-xxxx.vercel.app`

Bu adresi not et; APK için lazım.

### B3. Supabase Auth ayarı (giriş için zorunlu)

1. [supabase.com/dashboard](https://supabase.com/dashboard) → projen.
2. **Authentication** → **URL Configuration**.
3. **Site URL**: `https://giybet-xxxx.vercel.app` (kendi Vercel adresin).
4. **Redirect URLs** listesine ekle:
   - `https://giybet-xxxx.vercel.app`
   - `https://giybet-xxxx.vercel.app/**`
5. **Save**.

Tarayıcıda Vercel adresinden kayıt/giriş dene; çalışıyorsa APK için de hazır.

---

## Bölüm C — APK’yı bu siteye bağla

### C1. `.env.local` dosyası

Proje kökünde (`GiyBet` klasörü) `.env.local` aç; en alta ekle:

```env
# Android APK — Vercel adresin (sonunda / olmasın)
CAPACITOR_SERVER_URL=https://giybet-xxxx.vercel.app
```

Mevcut Supabase satırları duruyor; sadece `CAPACITOR_SERVER_URL` ekle.

### C2. Capacitor senkronizasyonu

PowerShell:

```powershell
cd "C:\Users\Mehmet OĞUR\Desktop\GiyBet"
npm run android:sync
```

Başarılı çıktıda şunlar görünür:

- `Copying web assets from public to android...`
- `Found 3 Capacitor plugins for android`

Bu komut `capacitor.config.ts` + `.env.local` içindeki URL’yi Android projesine yazar.

**Her `CAPACITOR_SERVER_URL` değiştirdiğinde** tekrar çalıştır:

```powershell
npm run android:sync
```

---

## Bölüm D — APK derle (Android Studio)

### D1. Projeyi aç

```powershell
npm run cap:android
```

Android Studio açılır ve `android` klasörünü yükler.

İlk açılışta altta **Gradle sync** çalışır; bitene kadar bekle (5–15 dk, internet gerekir).

Hata çıkarsa: **File** → **Sync Project with Gradle Files**.

### D2. Debug APK oluştur (test / arkadaşlara dağıtım)

1. Üst menü: **Build**
2. **Build Bundle(s) / APK(s)**
3. **Build APK(s)**
4. Sağ altta **APK(s) generated successfully** → **locate** tıkla.

Dosya yolu:

```
GiyBet\android\app\build\outputs\apk\debug\GiyBet-v1.1.0-debug.apk
```

Bu **debug APK**; Play Store’a yüklemek için imzalı release gerekir (Bölüm F).

### D3. Alternatif: komut satırından APK

Gradle ilk seferde indirme yapabilir; Android Studio bir kez sync yaptıysa daha kolay:

```powershell
cd "C:\Users\Mehmet OĞUR\Desktop\GiyBet"
npm run android:apk
```

Aynı `GiyBet-v*-debug.apk` oluşur.

---

## Bölüm E — Telefona yükle

### E1. USB ile (geliştirici)

1. Telefonda: **Ayarlar** → **Geliştirici seçenekleri** → **USB hata ayıklama** aç.
2. USB ile bağla.
3. PowerShell:

```powershell
cd "C:\Users\Mehmet OĞUR\Desktop\GiyBet\android\app\build\outputs\apk\debug"
adb install -r GiyBet-v1.1.0-debug.apk
```

(`adb` için Android SDK Platform-Tools gerekir; genelde Android Studio ile gelir.)

### E2. Dosya ile (en kolay)

1. `GiyBet-v*-debug.apk` dosyasını WhatsApp / Google Drive / kablo ile telefona at.
2. Dosyayı aç → **Yükle** / **Install**.
3. “Bilinmeyen kaynak” uyarısı çıkarsa → **Bu kaynağa izin ver** → tekrar dene.

### E3. Emülatörde test

Android Studio → üstte cihaz listesi → **Device Manager** → sanal telefon oluştur → yeşil **Run** (▶) veya:

```powershell
npm run cap:run:android
```

---

## Bölüm F — Deploy etmeden yerel test (isteğe bağlı)

Site henüz Vercel’de değilse:

1. Bilgisayarda sunucu:

```powershell
npm run dev
```

2. `.env.local`:

```env
# Android emülatör → bilgisayarın localhost’u
CAPACITOR_SERVER_URL=http://10.0.2.2:3000

# Fiziksel telefon (aynı Wi‑Fi) — ipconfig ile IP bul (ör. 192.168.1.42)
# CAPACITOR_SERVER_URL=http://192.168.1.42:3000
```

3. `npm run android:sync`
4. Emülatör veya telefonda uygulamayı aç.

---

## Bölüm G — Play Store (sonraki aşama)

Debug APK mağazaya yüklenmez. Yayın için:

1. Android Studio → **Build** → **Generate Signed Bundle / APK**
2. **Android App Bundle (AAB)** seç (Play Store bunu istiyor).
3. Yeni **keystore** oluştur (şifreyi kaybetme).
4. **release** build al.
5. [Google Play Console](https://play.google.com/console) → uygulama oluştur → AAB yükle.

Gerekli materyaller: ikon (512×512), ekran görüntüleri, kısa/açıklama metni, gizlilik politikası URL’si.

---

## Sık sorunlar

| Sorun | Ne yapmalı |
|--------|------------|
| Uygulama açılıyor ama boş / “yükleniyor” | `CAPACITOR_SERVER_URL` yanlış veya boş → `.env.local` düzelt → `npm run android:sync` → APK’yı yeniden derle |
| Beyaz ekran | Vercel site çöküyor olabilir; tarayıcıda aynı URL’i dene |
| Giriş / kayıt çalışmıyor | Supabase **Site URL** ve **Redirect URLs** Vercel adresini içeriyor mu? |
| Konum çalışmıyor | Telefonda konum izni ver; uygulama ayarlarından kontrol et |
| Mekan arama boş | Vercel’de `NEXT_PUBLIC_TOMTOM_KEY` tanımlı mı? |
| Gradle sync hatası | Android Studio → **File** → **Invalidate Caches** → Restart |
| `JAVA_HOME` hatası | Android Studio JDK kullan: **Settings** → **Build** → **Gradle** → Gradle JDK = Embedded JDK |

---

## Komut özeti

| Komut | Ne işe yarar |
|--------|----------------|
| `npm run build` | Web projesi derleme testi (Vercel öncesi) |
| `npm run android:sync` | Capacitor + Android güncelle (URL değişince şart) |
| `npm run cap:android` | Android Studio’yu aç |
| `npm run cap:run:android` | Emülatör/cihazda doğrudan çalıştır |
| `npm run android:apk` | Debug APK derle (komut satırı) |

---

## Kontrol listesi (APK öncesi)

- [ ] Vercel deploy başarılı, site tarayıcıda açılıyor
- [ ] Supabase Auth URL’leri Vercel adresine ayarlı
- [ ] `.env.local` içinde `CAPACITOR_SERVER_URL` doğru
- [ ] `npm run android:sync` hatasız bitti
- [ ] Android Studio Gradle sync tamam
- [ ] `GiyBet-v*-debug.apk` oluştu
- [ ] Telefonda giriş, gıybet, harita test edildi

---

## Proje bilgileri

| Alan | Değer |
|------|--------|
| Uygulama adı | GıyBet |
| Paket adı (appId) | `com.giybet.app` |
| Capacitor config | `capacitor.config.ts` |
| Android proje | `android/` klasörü |

Sorun yaşarsan: hata mesajının ekran görüntüsü + hangi adımda olduğunu yaz; birlikte bakılır.
