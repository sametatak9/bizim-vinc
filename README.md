# Bizim Vinç ERP

Vinç kiralama ve saha operasyon komuta merkezi.

**Slogan:** En derinden, en yükseklere

**Canlı:** https://bizim-vinc.vercel.app/  
**Repo:** https://github.com/sametatak9/bizim-vinc  
**Supabase:** `jimywfjufmrpgnjynhkx`

## Modüller

| Rota | Açıklama |
|------|----------|
| `/` | Komuta dashboard (KPI, harita, hareketler) |
| `/personel` | Personel + havuz |
| `/puantaj` | Yoklama / puantaj |
| `/onay` | Onay merkezi |
| `/filo` | Vinç filosu |
| `/operator` | Operatör aksiyonları |
| `/kart/:token` | Dijital kart (minimal, herkese açık alan) |
| `/finans` | Finans |
| `/cari` | Cari / müşteri |
| `/makbuz` | İş makbuzu / fatura hattı |
| `/admin` | Yönetim |
| `/tv` | TV kiosk |

## Çalıştırma

```bash
pnpm install
pnpm dev
```

## Veritabanı

**Canonical migrations:** `/migrations` (`0002` … `0011`).  
Ayrıntı: [`docs/DATABASE.md`](docs/DATABASE.md).

Production güvenlik script’i (zorunlu):

`migrations/0011_production_security_and_ops.sql` → Supabase SQL Editor’da bir kez çalıştırın.

## Güvenlik notları

- Client yalnızca **anon key** kullanır; service role yok.
- TC kimlik: `src/lib/tcHash.ts` ile hash; düz metin gönderilmez.
- RLS: aktif staff / founder-admin; `anon` tablo yetkileri revoke.
