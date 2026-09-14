# Bizim Vinç ERP — Toplu Import DRY-RUN Raporu

Tarih: 14.09.2026 · Kaynak: Drive "s kişisinden belge" (3 Excel + `manus-toplu-import-prompt-v2.md`)
Hedef: Supabase `jimywfjufmrpgnjynhkx` (production)
**Durum: hiçbir yazma yapılmadı. Onay bekleniyor.**

---

## Özet tablo

| Bölüm | Satır | Yeni | Güncelle | Durum |
|---|---|---|---|---|
| 1 — Cariler + açılış bakiyeleri | 220 + 220 | 220 | 0 | 🟡 şema eksiği + 1 checksum |
| 2 — Personel (+ sağlık izole) | 25 + 12 | 25 | 0 | 🟡 11 TC eksik + şema eksiği |
| 3 — Kasa hareketleri (referans) | 62 | 62 | 0 | 🟡 kaynak güvenilmez, salt-okunur |

Mevcut DB durumu: `customers` **0 kayıt** (yani tüm 220 cari yeni açılacak, upsert çakışması yok), `personnel` 2 kayıt (Hüseyin Samet Atak / Samet Ata — import edilen 25 e-posta ile **çakışma yok**), `job_receipts` 0, `invoices` 0, `payments` 36.

---

## BÖLÜM 1 — Cariler + Açılış Bakiyeleri

### 🟢 Doğrulanan
- 220 cari / 220 bakiye, **birebir eşleşiyor** (bakiyesiz cari 0, carisiz bakiye 0).
- `vergi_no` içinde **tekrar yok** (220 tekil).
- Net bakiye hesabım **80.921.930,27 TL** — Kontrol_Raporu ile **tam uyumlu**.
- 209 VKN + 11 TCKN; 11 TCKN'nin **tamamı checksum'dan geçti**.
- Tüm tutarlar TL, tarih 2026-09-12.

### 🟡 Dikkat
1. **PD CURIC DOO — VKN `0111230630` checksum'dan geçmiyor.** Yabancı (Slovenya/Sırbistan) firma olduğu için Türk VKN algoritmasına uymuyor olabilir; kayıt açılır ama `vkn_dogrulanmadi=true` bayrağı ile işaretlemeyi öneriyorum.
2. **3 cari "Bakiye Yok" (tutar 0):** AVRUPA OTOYOLU, AYYK GRUP, MBD TEKNOLOJİ. Cari kaydı açılacak, `opening_balances` satırı `tutar=0, yon='Bakiye Yok'` olarak yazılacak.
3. **4 cari alacaklı (bizim borcumuz):** LALE MEFRUŞAT 398.069,64 · DKYPLAST 108.344,08 · METRAN 87.452,00 · CK BOĞAZİÇİ 2.669,96.
4. **Telefon ve adres kolonları 220 satırda tamamen boş.** Ama canlı `customers.phone` kolonu **NOT NULL**. Şema değişikliği gerekiyor (aşağıda).
5. `hesap_tipi`: 218 Müşteri, 2 Tedarikçi.

### 🔴 Muhasebeci teyidi gereken — `v3_ile_Farkli_Olan_Cariler` (25 cari)
Ekstre ile önceki v3 bakiye raporu arasında **toplam 15.683.165,66 TL fark** var. En büyük 5:

| Cari | Ekstre TL | v3 TL | Fark TL |
|---|---|---|---|
| VESTAS RÜZGAR ENERJİSİ | 6.150.904,34 | 1.346.756,85 | 4.804.147,49 |
| COMITA RAZVOJ | 4.759.146,43 | 766.552,39 | 3.992.594,04 |
| UMH İNŞAAT | 1.043.000 | 10.000 | 1.033.000 |
| NESKO İNŞAAT | 1.791.919 | 943.275 | 848.644 |
| SİMAŞ MÜHENDİSLİK | 762.260,12 | 66.300 | 695.960,12 |

Talimata uygun olarak bu **işlemi durdurmuyor**; ekstre değeri (daha güncel olan) yazılacak, 25 satırın tamamı `import_batches.notes` içinde ve final raporda listelenecek.

---

## BÖLÜM 2 — Personel + KVKK Sağlık İzolasyonu

### 🟢 Doğrulanan
- 25 personel, **25 tekil e-posta** (birincil join anahtarı olarak kullanılacak), 25/25 telefon dolu.
- 14 personelde TC var, **14'ünün tamamı checksum'dan geçti**.
- `Saglik_Verisi_IZOLE` 12 satır, **12 e-postanın hepsi Personel sekmesinde eşleşti** (yetim kayıt yok).
- Tüm satırlarda `ise_baslama_tarihi` ve `dogum_tarihi` dolu → `personnel` trigger'ının zorunlu tuttuğu `start_date` sağlanıyor.

### 🟡 Dikkat
1. **11 personelde TC eksik** → `tc_hash=null`, otomatik üyelik eşleştirmesi (uyelik_onay) **çalışmayacak**, admin manuel bağlamak zorunda: Ahmet Selim AVŞAR, Birol BİRSEN, ERDEM AGAH REN, ERDOĞAN ÖZ, İsmail Cin, Kerem Özgün, MAHMUT EFEK, Muhammed Ali Yılmaz, Muhammed Raşit YILMAZ, RİFAT AKTÜZ, Sedat Paksoy.
2. **Maaş bilgisi hiç yok.** `personnel` trigger'ı `salary IS NULL` ise kaydı reddediyor → `salary=0` yazılacak, `notlar`'a "migrasyon: maaş girilmedi" düşülecek.
3. **`employee_no` NOT NULL + UNIQUE.** Excel'de 17 satırda `sicil_no` var, 8'inde yok → çakışmayı önlemek için tümüne `MIG-001…MIG-025` formatında sicil üretip gerçek `sicil_no`'yu ayrı kolonda saklamayı öneriyorum.
4. **`kind` kolonu sadece `operator` / `yardimci` / `idari` kabul ediyor.** 13 farklı ünvan var; eşleme: Vinç/Hi-Up/Sepetli/Mobil operatörleri + Ağır Vasıta Şoförü → `operator`; Yağcı/Sapancı → `yardimci`; Müdür/Sorumlu/Supervisor/Yönetici → `idari`. Gerçek ünvan `title`'da aynen korunacak.
5. **IBAN sadece 1 kişide dolu**, banka alanları büyük ölçüde boş.
6. **KVKK açık rıza:** sistemde rıza kaydı yok. Talimata uygun olarak `personnel_consents`'a **sahte onay üretilmeyecek**, 25 kişi için `durum='bekliyor'` (migrasyon nedeniyle form ayrıca alınacak) kaydı düşülecek.
7. Sağlık verisi: 12 kişi, kan grupları (4× A Rh+, 4× 0 Rh+, 2× B Rh+, 2× 0 Rh-), engelli 0. **Genel `personnel` / `personnel_documents` tablosuna yazılmayacak**, sadece kısıtlı RLS'li `personnel_health_data`'ya.

---

## BÖLÜM 3 — Kasa Hareketleri (SALT REFERANS)

- 62 hareket, 01.01.2026 → 12.09.2026. Türler: 52 Banka Tahsilat, 5 Çek-Senet Giriş, 4 Banka Ödeme, 1 Devir.
- Toplam alacak 14.770.777,48 TL · borç **-400.128,20 TL** (negatif borç → kaynak sistemde ters kayıt olabilir, raporda işaretlenecek).
- 🔴 **62 satırın tamamında `para_birimi=USD` görünüyor** ama rapor "Birim: TL" toplamından geliyor; 1. satırda KUR=1 & USD tutarsızlığı ayrıca işaretli.
- 6 farklı hesap (A.Ş Ana Hesap, Kuveyt Türk TL, KVPAY, Vakıf Katılım, TL Merkez, Kasa Çek) tek toplamda birleştiği için hesap ayrımı yapılamıyor.
- **Yapılacak tek şey:** salt-okunur `kasa_hareket_log` tablosuna `is_migrated=true`, `hesap_dogrulanmadi=true` bayraklarıyla yazmak. Hiçbir canlı bakiye/raporlamaya dahil edilmeyecek.
- ⏰ Hatırlatma (final raporda tekrar edilecek): **Cash/Treasury modülünün gerçek versiyonu için muhasebeciden her kasa/banka hesabını ayrı ayrı seçerek yeniden rapor istenecek.**

---

## Onay gereken şema değişiklikleri

Talimatta "tablo yoksa önce şemaya ekle, bana göster, onaylamadan yazma" dendiği için DDL'i ayrı dosyada hazırladım: `migrations/0028_bulk_import_migration.sql`.

**Yeni tablolar**
| Tablo | Amaç | Erişim |
|---|---|---|
| `import_batches` | Her bölüm için batch kaydı (import_type, total_rows, dosya adı, özet) | admin/founder |
| `opening_balances` | Açılış bakiyeleri (customer_id FK, tutar, yon, para_birimi, as_of_date) — `job_receipts`/`invoices`'a karışmaz | admin + muhasebe |
| `personnel_health_data` | KVKK izole sağlık verisi (kan_grubu, engelli_mi, saglik_durumu_notu) | **sadece admin/founder + yeni `isyeri_hekimi` rolü** |
| `personnel_consents` | KVKK açık rıza durumu (bekliyor/alindi) | admin/founder |
| `kasa_hareket_log` | Salt-okunur kasa referansı, `hesap_dogrulanmadi=true` | admin + muhasebe, sadece SELECT |

**Mevcut tablolara eklenecek (hiçbir kolon silinmiyor, veri kaybı yok)**
- `customers`: `phone` NOT NULL kaldırılıyor (220 satırda telefon yok) · `vkn_turu`, `hesap_tipi`, `hesap_kodu_kaynak`, `is_migrated`, `import_batch_id`, `vkn_dogrulanmadi` · `vkn_tckn` üzerine unique index (upsert için).
- `personnel`: `tc_hash`, `is_migrated`, `import_batch_id`, `sicil_no`, `dogum_tarihi`, `uyruk`, `cinsiyet`, `medeni_hali`, `bolum`, `birim`, `takim`, `calisma_sekli`, `isgucu_sinifi`, `yillik_izin_hakki`, `banka_adi`, `banka_hesap_sahibi`, `acil_durum_kisisi`, `acil_durum_telefon`, `sehir`, `ulke`, `resmi_sirket_unvani`.
- `profiles.role` CHECK'ine `isyeri_hekimi` ekleniyor (sağlık verisine erişecek tek ek rol).

**Değişmeyecekler:** `approval_requests`'a hiçbir kayıt yazılmayacak · hiçbir mevcut kayıt silinmeyecek · her bölüm ayrı `import_batch_id` + ayrı transaction · her batch için `audit_logs` özet kaydı.

---

## TC hash yöntemi
`src/lib/tcHash.ts` önce `hash-tc-identity` Edge Function'ını (HMAC) deniyor, yoksa `SHA-256("bizim-vinc:tc:" + digits)` fallback'ine düşüyor. Migrasyonda **uygulamanın canlıda fiilen ne ürettiğiyle aynı** olması kritik — Edge Function deploy edilmişse onu çağıracağım, değilse fallback formülünü kullanacağım. Bunu yazmadan önce kontrol edeceğim.
