# Bizim Vinç — implementation notes

## Status (2026-09-13)

Product routes (Dashboard, Personel, Puantaj, Onay, Filo, Operatör, Kart, Finans, Admin, TV, Makbuz, Cari) are implemented and wired to Supabase on Vercel.

## Canonical database

See **`docs/DATABASE.md`**. Use `/migrations/0002` … `0011` only.  
`supabase/migrations/*` dated experiments are deprecated.

## Before / with production data

1. Run `migrations/0011_production_security_and_ops.sql` (RLS + revoke anon).
2. Storage buckets + policies for personnel documents / health (when Storage is enabled).
3. Client TC hashing via `src/lib/tcHash.ts` (SHA-256); plan Edge Function HMAC for production secret.
4. Membership gate: profile `status` on login + memberships RLS.
5. Public card (`/kart/:token`): name, title, employee no, document flags only — no phone/TC/salary.
6. `audit_logs` append-only (INSERT/SELECT policies only).

## Migration order (canonical)

`0002_core` → `0003_security` → `0004` → `0005` → `0006` → `0007` → `0008` → `0009` → `0010` → **`0011_production_security_and_ops`**.
