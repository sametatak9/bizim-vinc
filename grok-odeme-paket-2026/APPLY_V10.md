# V10 Ödeme planı — SİL → YENİDEN YÜKLE

## Önkoşul
1. Supabase SQL Editor'da `migrations/0035_payment_lists_and_import_keys.sql` çalıştır.
2. `SUPABASE_SERVICE_ROLE_KEY` ortam değişkeni (Dashboard → Settings → API → service_role).

## Komutlar
```bash
export SUPABASE_URL=https://jimywfjufmrpgnjynhkx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service_role, ASLA frontend'e koyma

# 1) Mevcut sayılar
python3 scripts/import/load_payment_plan_v10.py --counts-only

# 2) Dry-run
python3 scripts/import/load_payment_plan_v10.py --dry-run

# 3) Wipe + apply (cari/personel/kasa DOKUNULMAZ)
python3 scripts/import/load_payment_plan_v10.py --wipe --apply

# 4) İkinci apply → 0 yeni kayıt (import_key unique)
python3 scripts/import/load_payment_plan_v10.py --apply
```

## Tarayıcı
localStorage temizle (founder konsol):
```js
['bv_payments','bv_payment_obligations','bv_commercial_papers','bv_custom_payment_lists']
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

## Korumalı
customers, personnel, opening_balances, kasa_hareket_log, invoices, job_receipts, #22 auth
