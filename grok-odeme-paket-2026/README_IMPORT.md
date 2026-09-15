# Bizim Vinç — 2026 Ödeme/Alacak Havuzu (Grok import paketi)

## Kaynak
Orijinal Excel: `RAW_2026_odeme_ve_cek_orijinal.xlsx`
- Ana sayfa: `2026 ÖDEME VE ÇEK` (Ocak–Aralık yan yana bloklar)
- Leasing şablon: `LEASİNG 48 AY` (VESA / GMK150XL / GMK450-1)

## Grok’un kullanacağı temiz dosyalar
1. `bizim_vinc_2026_odeme_havuzu_IMPORT.csv` — **357 satır**, 2026-01-01 → 2026-12-31  
   Kolonlar: period_month, due_date, kind (odeme|cek), category, title, amount_tl, amount_euro, paid_amount_tl, status, installment_no/count, import_key…
2. `bizim_vinc_leasing_48ay_IMPORT.csv` — leasing obligation taksitleri (EUR)
3. `bizim_vinc_senet_alacaklari_IMPORT.csv` — 21 senet
4. `bizim_vinc_odeme_listeleri_DEDUPED_IMPORT.csv` — 68 satır (Mayıs revizyon dedupe)
5. `IMPORT_SUMMARY.json` — ay/kategori özeti

## Category map
leasing, maas, sigorta, fatura, dbs, kredi_karti, cek, vergi, ticari_kredi, personel, muhasebe, dis_hizmet, insaat, digger

## Idempotency
`import_key` ile tekrar yüklemede duplicate oluşturma. Bkz. `APPLY_V10.md`.
