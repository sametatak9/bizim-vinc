# Supabase tabloları — tek seferde kurulum

Senin Supabase projenе Grok doğrudan bağlanamaz (service role key / connector yok).
Bu yüzden tabloları **senin hesabında** bir kez çalıştırman gerekiyor.

## En kolay yol (önerilen)

1. GitHub’da şu dosyayı aç:
   `supabase/migrations/000_ALL_IN_ONE_RUN_ONCE.sql`
2. **Raw** → tüm metni kopyala
3. [Supabase Dashboard](https://supabase.com/dashboard) → projen → **SQL Editor** → New query
4. Yapıştır → **Run**

Bu dosya 001 + 002 + 003 migration’ların birleşimidir.

## Alternatif (CLI)

```bash
supabase link --project-ref SENIN_PROJECT_REF
supabase db push
```

## Başarılı oldu mu?

SQL Editor’da şunu çalıştır:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
order by 1;
```

`personnel`, `cranes`, `approval_requests` vb. görünmeli.
