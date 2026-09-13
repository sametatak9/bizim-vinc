# Bizim Vinç ERP — Deploy ve bağlantılar

## Tek kaynak (karışıklık yok)
- **Uygulama kodu:** `artifacts/bizim-vinc-erp/src/`
- **Build çıktısı:** `artifacts/bizim-vinc-erp/dist/public/`
- Kök `src/` Vercel build’ine girmez (eski kopya)

## GitHub
- Repo: `sametatak9/bizim-vinc`
- Branch: `main`

## Vercel
- Proje: **bizim-vinc** (yalnızca bu)
- Domain: https://bizim-vinc.vercel.app
- Root Directory: boş (repo kökü)
- Build: `npm --prefix artifacts/bizim-vinc-erp install` + `npm run build`

## Supabase
- URL: https://jimywfjufmrpgnjynhkx.supabase.co
- Vercel → Settings → Environment Variables (Production):
  - `VITE_SUPABASE_URL` = `https://jimywfjufmrpgnjynhkx.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = Supabase Dashboard → Settings → API → anon public
- Supabase → Authentication → URL Configuration:
  - Site URL: `https://bizim-vinc.vercel.app`
  - Redirect: `https://bizim-vinc.vercel.app/**`

## Yeni özellik
1. Sadece `artifacts/bizim-vinc-erp/src/` düzenle
2. Commit + push `main`
3. Vercel Production deploy
