# FAZ4 — Ödeme/Çek/Senet İnceleme ve Yönetici Ana Sayfa Bulguları

Tarih: 15.09.2026 · Proje: Supabase `jimywfjufmrpgnjynhkx` (production)

## Özet

Bu oturumda FAZ4 (§ master prompt) için `BIZIM_VINC_ODEME_PAKET_2026/` klasöründeki Excel/CSV paketi incelendi ve production veritabanı ile karşılaştırıldı. **Ana bulgu: paketin veri importu bu oturumdan önce, aynı gün saat 10:10'da başka bir süreçle zaten tamamlanmıştı** — 357 satırlık ana ödeme havuzu, 21 satırlık senet alacakları ve 5 adlı aylık ödeme planı listesi (NİSAN, 09.05, 13.05, 18.05, 10.07) production'da mevcuttu, `payment_lists`/`payment_list_items` içinde doğru şekilde bağlıydı. Bu oturum bu veriyi tekrar yüklemeye çalıştı (idempotency anahtarları sayesinde 0 yeni satır eklendi), yanlışlıkla 5 yinelenen `payment_lists` satırı oluşturdu ve bunu aynı oturumda temizledi.

## Uygulanan migration'lar

| Migration | Ne yaptı |
|---|---|
| `0035_payment_lists_and_import_keys.sql` | Repo'da vardı ama production'a hiç uygulanmamıştı; bu oturumda uygulandı. `payment_lists`/`payment_list_items`, import key/dedupe kolonları, `wipe_payment_plan_data()` RPC. |
| `0036_personnel_ledger.sql` | FAZ1 (bu rapor kapsamı dışı, ayrı commit'te). |
| `0037_faz4_monthly_payment_lists_data.sql` | **No-op oldu.** İkinci workbook'un 67 satırını (68 - 1 TOPLAM satırı) yüklemeye çalıştı; hepsi `external_import_key` ile mevcut satırlarla eşleşti, 0 yeni `payments` eklendi. Tek gerçek etkisi: 5 yinelenen `payment_lists` satırı. |
| `0038_faz4_payment_lists_dedupe_cleanup.sql` | 0037'nin yarattığı 5 yinelenen `payment_lists` satırını (ve cascade ile bağlı `payment_list_items`'ı) sildi. Orijinal 7 liste ve 424 `payments` satırına dokunmadı. |

Doğrulanmış son durum: `payment_lists`=7, `payment_list_items`=445, `payments`=424 (bu oturum öncesiyle birebir aynı).

## Veri kalitesi notları (muhasebeci teyidi gerekiyor)

1. **`a2a290318df5a9c6_...` satırı** (18.05.2026 ÖDEME PLANI, "NİSAN AYI PRİM", 570.000 ₺): kaynak CSV'de vade tarihi `31-06-2026` olarak geliyor — Haziran'ın 31. günü yok. Bu oturumdan önceki import bunu `2026-05-31` olarak kaydetmiş (satırın notlarında `KAYNAK TARIH HATALI` etiketi yok, ama tarih mantıklı bir tahminle düzeltilmiş görünüyor). **Gerçek vade tarihi muhasebeciden teyit edilmeli.**
2. **Ana havuz (357 satır) ile ikinci workbook'un 5 adlı listesi (67 satır) arasındaki ilişki doğrulanmadı.** İkisi de Nisan–Temmuz 2026 dönemini kapsıyor; aynı gerçek ödeme yükümlülüklerinin iki farklı görünümü mü (aynı borç, planlama listesi olarak tekrar listelenmiş) yoksa ek/farklı kalemler mi olduğu net değil. Bu yüzden Yönetici Ana Sayfa'nın KPI toplamı **yalnızca ana havuzdan** (`source_list_id IS NULL`) hesaplanıyor; ikinci workbook'un listeleri ayrı, "örtüşme olabilir" etiketiyle gösteriliyor (bkz. `docs/FIGMA_YONETICI_ANA_SAYFA.md`).
3. **`leasing_48ay` CSV'sinin (122 satır) tamamı import edilmemiş** — production'da sadece main-pool'un "leasing" kategorisi (`kira`, 95 satır, 59.434.116,88 TL — `IMPORT_SUMMARY.json`'daki `leasing` toplamıyla birebir eşleşiyor) var; ayrı `leasing_48ay` planı henüz yüklenmedi. Bu paket bu oturumda **hiç dokunulmadan** bırakıldı — kim yüklediyse (10:10'daki süreç) muhtemelen bilinçli olarak atlamış veya henüz sırası gelmemiş. Sonraki adım olarak değerlendirilmeli.

## Yapılan (bu oturumda, gerçek yeni iş)

- `src/components/dashboard/PaymentCommandCenter.tsx`: Yönetici Ana Sayfa'nın aylık/yıllık ödeme-tahsilat-çek-senet komuta merkezi UI'ı. `DashboardPage.tsx`'teki eski küçük "ödeme planı" widget'ının yerini aldı (yalnızca founder/admin/yonetici/muhasebe rolleri için, `/` rotasında).
- `payments`, `payment_lists` için store.tsx fetch/tip genişletmeleri (`title`, `kind`, `sourceListId` alanları + `paymentLists` state) — önceden hiç okunmuyordu.
- `docs/FIGMA_YONETICI_ANA_SAYFA.md`: tasarım spec'i (Figma hesabı bu ortamda yoktu, markdown fallback).

## Yapılmadı / sonraki adımlar

1. `leasing_48ay_IMPORT.csv` (122 satır) import edilmedi — karar bekliyor.
2. `PaymentPlanningPage.tsx`'in "liste fabrikası" hâlâ `localStorage` (`bv_custom_payment_lists`) kullanıyor, gerçek `payment_lists` tablosuna taşınmadı. Yönetici Ana Sayfa DB'deki gerçek listeleri gösteriyor ama liste oluşturma/düzenleme hâlâ eski (cihaza özel, paylaşılmayan) mekanizmada.
3. Madde 2'deki tarih hatası ve madde 2 (ana havuz/liste örtüşmesi) muhasebeci tarafından teyit edilmeli.
