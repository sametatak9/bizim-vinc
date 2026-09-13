# Supabase kurulum (2 dakika)

## Yol A — Minimal (önerilen, ilk kurulum)

1. https://supabase.com/dashboard → projeni aç
2. Sol menü **SQL Editor** → **New query**
3. GitHub dosyasını aç: `supabase/migrations/000_MINIMAL_CORE.sql`
4. **Raw** → tümünü kopyala → SQL Editor’a yapıştır → **Run**
5. Sonuçta `OK — personnel: 3` benzeri satır görmelisin

Kontrol:
```sql
select table_name from information_schema.tables
where table_schema = 'public' order by 1;
```

Görmen gerekenler: `profiles`, `personnel`, `cranes`, `approval_requests`

## Yol B — Tam şema (ileri seviye)

`000_ALL_IN_ONE_RUN_ONCE.sql` veya 001→002→003 sırayla.

## Env (Vercel / lokal)

```
VITE_SUPABASE_URL=https://XXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Project Settings → API sayfasından kopyala.
