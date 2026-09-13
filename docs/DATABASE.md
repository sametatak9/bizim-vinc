# Bizim Vinç — Database (canonical)

**Supabase project:** `jimywfjufmrpgnjynhkx` (eu-central-1)

## Canonical migration path

Use **`/migrations`** only (ordered `0002` … `0011`):

| File | Purpose |
|------|---------|
| `0002_core.sql` | Core ERP tables (v2) |
| `0003_security_ops_foundation.sql` | profiles/memberships/quotes RLS helpers |
| `0004_auth_profile_link.sql` | Auth ↔ profile |
| `0005_concurrency_safe_document_numbers.sql` | Number sequences |
| `0006_attendance_payroll_foundation.sql` | HR/payroll foundation |
| `0007_tighten_personnel_profile_rls.sql` | Personnel scoping |
| `0008_hr_fleet_operations_fields.sql` | Fleet/HR columns |
| `0009_finance_core_missing_tables.sql` | Finance tables |
| `0010_schema_compatibility_for_app_crud.sql` | App CRUD column align |
| `0011_production_security_and_ops.sql` | **Anon revoke, staff RLS, audit append-only** |

## Deprecated

Everything under `supabase/migrations/` (dated experiments `20260912_*`, `20260913_*`, `000_MINIMAL_*`) is **archived intent** — do not apply on a clean project. Kept for history; prefer `/migrations`.

If a live DB was built from the dated files, still run **`0011_production_security_and_ops.sql`** once in the SQL Editor to align security.

## Apply order (SQL Editor)

1. Run `0002` → `0010` if schema is empty.
2. Always run `0011_production_security_and_ops.sql` on production/staging.
3. Verify:

```sql
SELECT c.relname, c.relrowsecurity AS rls_on, count(p.polname) AS policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public' AND c.relkind = 'r'
GROUP BY 1, 2 ORDER BY 1;
```

Expect `rls_on = true` and `policies >= 1` on business tables. Anon should not SELECT business data.
