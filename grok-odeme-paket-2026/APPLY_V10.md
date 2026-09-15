# V10 Ödeme planı — SİL → YENİDEN YÜKLE → DB SEED

## A) Şema + veri (Supabase SQL Editor)
1. `migrations/0035_payment_lists_and_import_keys.sql` çalıştır
2. `0036_seed_payment_plan_2026.sql` çalıştır (tek dosya ~220KB)
   - veya parçalı: `0036_seed_part1of5.sql` → `part5of5.sql` sırayla

Seed:
- Wipe: payments, obligations, commercial_papers, payment_lists, migrated collections
- ~400+ payments (2026 havuz + liste kalemleri)
- 21 alinan_senet + Senet Alacakları listesi
- 5 aylık/revizyon liste (Nisan, 09.05, 13.05, 18.05, Temmuz)
- 3 leasing obligation (VESA, GMK150XL, GMK450-1)
- `external_import_key` unique

**KORUNAN:** customers, personnel, opening_balances, kasa_hareket_log, invoices, job_receipts, #22 auth

## B) Beklenen sayılar (seed sonu SELECT)
| tablo | ~adet |
|-------|------|
| payments | 400+ |
| commercial_papers | 21 |
| payment_lists | 7 |
| payment_list_items | 400+ |
| payment_obligations | 3 |

## C) Tarayıcı
```js
['bv_payments','bv_payment_obligations','bv_commercial_papers','bv_custom_payment_lists']
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

## D) Dosya konumu
- Repo / artifacts: `grok-odeme-paket-2026/`
- CSV kaynaklar + `load_payment_plan_v10.py` (service_role alternatif)
