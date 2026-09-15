# Bizim Vinç — Yönetici Ana Sayfa v1 (tasarım spec)

**Durum:** Bu oturumda Figma hesabına bağlanılamadı (MCP Figma bağlantısı bu ortamda yoktu), bu yüzden brief'in F4.4 fallback talimatına göre ("Figma hesabı yoksa: aynı spec'i markdown + SVG/HTML mock üret") spec burada markdown olarak üretildi. Uygulama kodu (`src/components/dashboard/PaymentCommandCenter.tsx`) bu spec'i birebir uygular. Figma'ya aktarım istenirse bu doküman referans alınabilir.

## Frame'ler
- **Desktop 1440** — `/` rotası, `DashboardPage` içinde `financeVisible` (founder/admin/yonetici/muhasebe) roller için üstte tam genişlik bant.
- **Mobile 390** — aynı bileşen, grid'ler `sm:`/`lg:` breakpoint'lerinde tek sütuna düşer (zaten Tailwind responsive sınıflarıyla uygulanmış durumda).

## Marka
`#15803D` / `#16A34A` (emerald-600/700 Tailwind paleti), beyaz kart zemin, `rounded-2xl` köşe, `shadow-sm`. Mevcut ERP'nin geri kalanıyla aynı dil (bkz. `DashboardPage.tsx`, `PersonnelPage.tsx`).

## Bileşen hiyerarşisi

```
Yönetici Komuta Merkezi (section, border-2 border-emerald-200)
├─ Başlık + Aylık/Yıllık toggle (sağ üst)
├─ Ay/Yıl seçici satırı
│   ├─ ◀ önceki ay
│   ├─ [Ay dropdown] [Yıl dropdown]
│   ├─ ▶ sonraki ay
│   └─ "Ödeme & Tahsilat Planlamasını Aç" (sağa yaslı, /finans-planlama'ya link)
│
├─ YILLIK GÖRÜNÜM (view=yearly)
│   ├─ KPI şeridi: Yıllık Yük · Ödenen · Kalan · Kayıt sayısı
│   └─ 12 ay mini-bar grid (tıklanabilir → o aya + aylık görünüme geçer)
│
└─ AYLIK GÖRÜNÜM (view=monthly, varsayılan)
    ├─ KPI şeridi: Ayın Planı · Ödenen · Kalan · Vadesi Geçen
    ├─ Alt satır: Tahsilat / Çek / Senet toplamları (tek satır özet)
    ├─ Sekmeler: Ödeme | Tahsilat | Çek | Senet (sayaçlı)
    └─ Seçili sekmenin listesi (scroll'lu, max-h-[420px])
        ├─ Ödeme: ana havuz satırları (tek tek "Ödendi işaretle" aksiyonu)
        │   └─ + Excel'in adlı liste blokları (ör. "NİSAN 2026 ÖDEME PLANI") — amber
        │     arka plan, "ana havuzla örtüşme olabilir, muhasebeci teyidi bekliyor" notu
        ├─ Tahsilat: collections satırları ("Tahsil edildi" aksiyonu)
        └─ Çek / Senet: commercial_papers satırları (yöne göre "Tahsile ver" / "Ödendi işaretle")
```

## Veri kaynağı ve çift-sayım kuralı (kritik)

- **Ana yıllık/aylık KPI toplamı** yalnızca `payments.source_list_id IS NULL` satırlarından hesaplanır (Excel'in ana "2026 ÖDEME VE ÇEK" havuzu, 357 satır + varsa ek satırlar).
- Excel'in **ikinci workbook**'undaki adlı plan sayfaları (NİSAN/09.05/13.05/18.05/10.07 — `source_list_id` dolu, `payment_lists` tablosuna bağlı) KPI toplamına **dahil edilmez**; aylık "Ödeme" sekmesinde ayrı, adı korunmuş bloklar halinde gösterilir çünkü bu listelerin ana havuzla aynı kalemleri mi yoksa ek kalemleri mi temsil ettiği doğrulanmamıştır (bkz. `docs/migrations/2026-09-15-faz4-odeme-import-bulgulari.md`).
- Bu ayrım kod içinde `mainPoolPayments` / `monthListPayments` filtreleriyle uygulanır.

## Kart/tablo satırı alanları
Ödeme satırı: `başlık (title || recipientName)`, `vade tarihi`, `muhatap (recipientName)`, `not`, tutar (₺, mono font), durum rozeti veya aksiyon butonu.
Çek/Senet satırı: `muhatap (alınan→debtor, verilen→beneficiary)`, `vade`, `belge no`, `tür etiketi`, tutar, aksiyon.

## Etkileşim kuralları
- Ay değişince (◀/▶ veya dropdown) sekme seçimi korunur, sadece veri filtrelenir.
- Yıllık görünümde bir aya tıklamak hem `view='monthly'` hem `month=<tıklanan>` set eder.
- Aksiyon butonları mevcut store fonksiyonlarını çağırır (`markPaymentPaid`, `markCollectionReceived`, `updateCommercialPaperStatus`) — yeni RPC yazılmadı, tam "settle + dekont" akışı hâlâ `/finans-planlama`'da.

## Yapılmadı / sonraki iterasyon
- Gerçek Figma dosyası (hesap bağlanınca bu spec'ten üretilebilir).
- "Hatırlat" (bildirim gönderme) ve "Ara" (telefon) aksiyonları — telefon alanı henüz frontend tipinde yok (DB'de `collections.phone` / `commercial_papers.phone` var ama `Collection`/`CommercialPaper` TS arayüzlerine eklenmedi).
- `payment_lists`/`payment_list_items` için tam CRUD UI (PaymentPlanningPage hâlâ localStorage tabanlı `customLists` kullanıyor, DB tablosuna taşınmadı — bkz. rapor).
