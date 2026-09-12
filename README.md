# Bizim Vinç ERP

Vinç kiralama ve saha operasyon komuta merkezi.

**Slogan:** En derinden, en yükseklere

## FAZ 0 — Komuta Dashboard ✅
- Üst yatay menü
- KPI kartları
- Son hareketler, bekleyen onaylar
- Aktif saha görevlendirmeleri tablosu
- Filo durumu + devam durumu panelleri
- Demo verisi ile çalışır

## FAZ 1 — Personel + Dijital Kart ✅
- Personel listesi (arama + tür + durum filtresi)
- KPI özeti (toplam, görevli, eksik evrak, dijital kart)
- Satır tıklanınca dijital kart önizleme modalı
- Demo personel verisi (`src/data/personnel.ts`)
- Nav üzerinden `/personel` rotası aktif

## Sonraki fazlar
2. Onay Merkezi
3. Filo
4. Teklif → sözleşme → makbuz
5. Admin + TV

## Çalıştırma

```bash
pnpm install
pnpm --filter @workspace/bizim-vinc-erp run dev
```

## Database
Migration dosyaları: `supabase/migrations/`

Sırayla Supabase SQL Editor’da çalıştırın:
1. `20260912_001_bizim_vinc_init.sql`
2. `20260912_002_ops_contracts_quotes.sql`
3. `20260912_003_claude_enhancements.sql`
