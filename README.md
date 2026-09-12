# Bizim Vinç ERP

Vinç kiralama ve saha operasyonları için geliştirilen ERP başlangıç projesi.

## Mevcut durum

- Dashboard sekmesi hazır ve demo verileriyle çalışıyor.
- Personel, onay, filo, finans, TV, admin ve ayarlar menüleri için ürün iskeleti bulunuyor.
- Responsive web arayüzü hazır.
- Supabase migration planları `supabase/migrations/` altında tutuluyor.
- Gerçek auth, RLS ve canlı Supabase verisi sonraki aşamada bağlanacak.

## Çalıştırma

```bash
pnpm install
pnpm --filter @workspace/bizim-vinc-erp run dev
```

Production build:

```bash
pnpm --filter @workspace/bizim-vinc-erp run build
```

Vercel yapılandırması, build çıktısını `artifacts/bizim-vinc-erp/dist/public` klasöründen yayınlayacak şekilde hazırlanmıştır.