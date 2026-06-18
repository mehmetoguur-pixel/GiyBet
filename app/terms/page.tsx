import { LegalLayout } from "@/components/LegalLayout";

export const metadata = {
  title: "Kullanım Koşulları — GıyBet",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Kullanım Koşulları">
      <p>
        GıyBet&apos;i kullanarak aşağıdaki koşulları kabul edersiniz. Platform anonim gıybet
        paylaşımına odaklanır; gerçek kimliğiniz gıybet adınızla birleştirilmemelidir.
      </p>
      <p>
        Yasak içerikler: nefret söylemi, tehdit, cinsel içerik, kişisel veri ifşası, spam ve yasa
        dışı faaliyet teşviki. Bu tür içerikler şikayet edilebilir ve kaldırılabilir.
      </p>
      <p>
        Kullanıcılar diğer gıybetçileri engelleyebilir ve içerikleri şikayet edebilir. Moderasyon
        ekibi şikayetleri inceleyebilir.
      </p>
      <p>
        Hizmet &quot;olduğu gibi&quot; sunulur. Konum ve üçüncü parti API&apos;ler (harita, mekan
        arama) kullanılabilir.
      </p>
      <p className="text-xs text-zinc-600">Son güncelleme: 2026</p>
    </LegalLayout>
  );
}
