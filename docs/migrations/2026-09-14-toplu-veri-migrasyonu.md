# Bizim Vinç ERP — Toplu Migrasyon Final Raporu

Tarih: 14.09.2026 · Proje: Supabase `jimywfjufmrpgnjynhkx` (production)
Kaynak: Drive "s kişisinden belge" → 3 Excel + `manus-toplu-import-prompt-v2.md`
Uygulanan şema: `migrations/0028_bulk_import_migration.sql` + `revoke_anon_exec_import_helpers`

## Batch kimlikleri

| Bölüm | import_batch_id | Satır | Yeni | Güncellenen | Hata |
|---|---|---|---|---|---|
| 1 — Cari + açılış bakiyesi | `1b73efaf-d09c-4886-8ba4-39ef552394c0` | 220 | 220 | 0 | 0 |
| 2 — Personel + izole sağlık | `f230dfaa-dc2c-40ac-9074-601c95e187a0` | 25 | 25 | 0 | 0 |
| 3 — Kasa referans | `cb0c40ca-6db8-40c2-8a9a-9f48af8f6586` | 62 | 62 | 0 | 0 |

Üç bölüm birbirinden bağımsız, her biri tek CTE-transaction içinde yazıldı. Her batch için `audit_logs`'a `action='BULK_IMPORT'` özet kaydı düştü (3 kayıt).

## Doğrulanmış son durum (canlı sorgu)

| Tablo | Kayıt |
|---|---|
| `customers` | 220 |
| `opening_balances` | 220 |
| `personnel` (migrasyon) | 25 (toplam 27, önceki 2 kayıt korundu) |
| `personnel_health_data` | 12 |
| `personnel_consents` | 25 (hepsi `bekliyor`) |
| `kasa_hareket_log` | 62 |
| `import_batches` | 3 |
| `audit_logs` (BULK_IMPORT) | 3 |
| `approval_requests` | **0 — hiç dokunulmadı** |
| `job_receipts` / `invoices` | **0 / 0 — karıştırılmadı** |

- Açılış bakiyesi net toplamı DB'de: **80.921.930,27 TL** (Borçlu − Alacaklı) — kaynak Kontrol_Raporu ile birebir.
- 213 borçlu · 4 alacaklı · 3 bakiyesiz cari.
- Personel `kind` dağılımı: 16 operatör, 6 idari, 3 yardımcı (gerçek ünvanlar `title`'da aynen korundu).
- Kasa referans: borç −400.128,20 TL · alacak 14.770.777,48 TL, 62/62 satır `hesap_dogrulanmadi=true`.

## Bölüm 1 — Muhasebeci teyidi bekleyen 25 cari

Ekstre ile v3 raporu arasındaki toplam fark **15.683.165,66 TL**. Her satır `opening_balances.v3_fark_var=true` + `v3_bakiye` + `notlar` alanlarına işlendi, yani DB'den sorgulanabilir:

```sql
select c.title, ob.tutar as ekstre_tl, ob.v3_bakiye as v3_tl, ob.tutar - ob.v3_bakiye as fark
from opening_balances ob join customers c on c.id = ob.customer_id
where ob.v3_fark_var order by 4 desc;
```

En büyük 5: VESTAS RÜZGAR (4.804.147,49) · COMITA RAZVOJ (3.992.594,04) · UMH İNŞAAT (1.033.000) · NESKO İNŞAAT (848.644) · SİMAŞ MÜHENDİSLİK (695.960,12). Yazılan değer **ekstre** (daha güncel) değeridir.

Ek uyarı: **PD CURIC DOO** (VKN `0111230630`) Türk VKN checksum'ından geçmiyor — yabancı firma olduğu için beklenen durum, `customers.vkn_dogrulanmadi=true` ile işaretlendi.

## Bölüm 2 — KVKK ve TC eksikleri

- **11 personelde TC yok** → `tc_hash IS NULL`, otomatik üyelik eşleştirmesi (uyelik_onay) **çalışmayacak**, admin manuel bağlamalı: Ahmet Selim AVŞAR, Birol BİRSEN, ERDEM AGAH REN, ERDOĞAN ÖZ, İsmail Cin, Kerem Özgün, MAHMUT EFEK, Muhammed Ali Yılmaz, Muhammed Raşit YILMAZ, RİFAT AKTÜZ, Sedat Paksoy.
- TC'si olan 14 kişide `tc_hash` = `SHA-256('bizim-vinc:tc:' + rakamlar)`. `hash-tc-identity` Edge Function **deploy edilmemiş** durumda, yani uygulamanın canlıda ürettiği fallback ile birebir aynı. Edge Function sonradan deploy edilirse hash'lerin yeniden üretilmesi gerekir.
- **Düz metin TC hiçbir tabloya yazılmadı** (`personnel.tc_no` boş bırakıldı).
- Sağlık verisi (kan grubu, engellilik, sağlık notu) yalnızca `personnel_health_data`'da; RLS sadece founder/admin + yeni `isyeri_hekimi` rolüne açık, `anon` tamamen revoke.
- 25 kişi için `personnel_consents` kaydı `durum='bekliyor'` — **sahte onay üretilmedi**, açık rıza formları ayrıca alınmalı.
- Maaş bilgisi kaynakta yok; `personnel` trigger'ı NULL kabul etmediği için `salary=0` yazıldı ve her kaydın `notes` alanına not düşüldü.
- Sicil numarası çakışmasın diye `employee_no` = `MIG-001…MIG-025`; kaynaktaki gerçek sicil `sicil_no` kolonunda saklanıyor (17 kişide dolu).

## Bölüm 3 — Kasa hareketleri neden canlı bakiyeye dahil edilmedi

1. Kaynak rapor **6 farklı hesabı** (A.Ş Ana Hesap, Kuveyt Türk TL, KVPAY, Vakıf Katılım, TL Merkez, Kasa Çek) tek "Birim: TL" toplamında birleştirmiş; hangi hareketin hangi hesaba ait olduğu ayırt edilemiyor → `hesap_dogrulanmadi=true`.
2. 62 satırın tamamında `para_birimi=USD` etiketi var ama veriler TL toplamından geliyor; 1. satırda KUR=1 iken USD görünüyor → `para_birimi_dogrulanmadi=true`, orijinal etiket ve `durum` uyarısı aynen saklandı.
3. `kasa_hareket_log` tablosunda bilinçli olarak **INSERT/UPDATE/DELETE politikası yok** — uygulama açısından salt okunur.

⏰ **Hatırlatma:** Cash/Treasury modülünün gerçek versiyonu için muhasebeciden **her kasa/banka hesabını ayrı ayrı seçerek** yeni bir rapor istemen gerekiyor. Bu tablo yalnızca o veri geldiğinde çapraz kontrol için duruyor.

## Geri alma (rollback)

Her kayıt `import_batch_id` taşıyor, yani bölüm bazında geri alınabilir:

```sql
-- örnek: bölüm 1'i geri al
delete from opening_balances where import_batch_id = '1b73efaf-d09c-4886-8ba4-39ef552394c0';
delete from customers      where import_batch_id = '1b73efaf-d09c-4886-8ba4-39ef552394c0';
update import_batches set status = 'rolled_back' where id = '1b73efaf-d09c-4886-8ba4-39ef552394c0';
```

## Yapılan şema değişiklikleri

Yeni tablolar: `import_batches`, `opening_balances`, `personnel_health_data`, `personnel_consents`, `kasa_hareket_log` (hepsinde RLS açık, `anon` revoke).
Yeni fonksiyonlar: `is_occupational_physician()`, `is_finance_staff()` (anon EXECUTE revoke edildi).
`customers`: `phone` NOT NULL kaldırıldı (kaynakta telefon yok) + `vkn_turu`, `hesap_tipi`, `hesap_kodu_kaynak`, `vkn_dogrulanmadi`, `is_migrated`, `import_batch_id` + `vkn_tckn` unique index.
`personnel`: `tc_hash`, `sicil_no`, `dogum_tarihi`, `uyruk`, `cinsiyet`, `medeni_hali`, `bolum`, `birim`, `takim`, `calisma_sekli`, `isgucu_sinifi`, `yillik_izin_hakki`, `banka_adi`, `banka_hesap_sahibi`, `acil_durum_kisisi`, `acil_durum_telefon`, `sehir`, `ulke`, `resmi_sirket_unvani`, `is_migrated`, `import_batch_id` + `tc_hash` / `lower(email)` unique index.
`profiles.role` CHECK'ine `isyeri_hekimi` eklendi (mevcut `founder` rolü korunarak).

Hiçbir kolon veya kayıt silinmedi.

## Sıradaki işler

1. Muhasebeciyle 25 caride v3 farkını teyit et (15,68 M TL).
2. 11 personelin TC'sini tamamla, `tc_hash`'i doldur → üyelik eşleştirmesi çalışsın.
3. KVKK açık rıza formlarını topla, `personnel_consents.durum='alindi'` yap.
4. Muhasebeciden hesap bazlı kasa/banka raporu iste (Cash/Treasury modülü için).
5. Personel maaş bilgilerini gir (şu an hepsi 0).
6. Frontend: `/cari` ve `/personel` modüllerinin yeni kolonları göstermesi için arayüz tarafında alan eklemesi gerekebilir.
