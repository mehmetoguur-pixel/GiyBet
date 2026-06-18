import { LegalLayout } from "@/components/LegalLayout";

export const metadata = {
  title: "Gizlilik Politikası — GıyBet",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Gizlilik Politikası">
      <p>
        GıyBet, konum tabanlı anonim sosyal deneyim sunar. Kayıt için e-posta veya telefon bilgisi
        saklanır; uygulama içinde yalnızca seçtiğiniz gıybet adı ve avatar görünür.
      </p>
      <p>
        Konum verisi, yakınındaki gıybetleri ve harita özelliklerini göstermek için kullanılır.
        Konum paylaşımı cihaz izinlerinize bağlıdır; izin vermezseniz varsayılan bölge kullanılabilir.
      </p>
      <p>
        Paylaşılan içerikler (metin, fotoğraf, yorumlar) Supabase altyapısında saklanır. Şikayet
        edilen içerikler moderasyon için kayıt altına alınır.
      </p>
      <p>
        Verilerinizi silmek veya hesabınızı kapatmak için uygulama içinden çıkış yapabilir ve
        destek kanalımızla iletişime geçebilirsiniz.
      </p>
      <p className="text-xs text-zinc-600">Son güncelleme: 2026</p>
    </LegalLayout>
  );
}
