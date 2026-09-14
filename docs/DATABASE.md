# Bizim Vinç — Database (canonical)

**Supabase project:** `jimywfjufmrpgnjynhkx` (eu-central-1)

## Canonical migration path

Use **`/migrations`** only. Filenames are globally unique and must remain strictly increasing. The production Supabase migration history was checked before this repository-only rename.

| File | Production durumu | Purpose |
|------|-------------------|---------|
| `0002_core.sql` | Uygulandı | Core ERP tables |
| `0003_security_ops_foundation.sql` | Uygulandı | Profiles, memberships and security helpers |
| `0004_auth_profile_link.sql` | Uygulandı | Auth ↔ profile link |
| `0005_concurrency_safe_document_numbers.sql` | Uygulandı | Number sequences |
| `0006_attendance_payroll_foundation.sql` | Uygulandı | HR/payroll foundation |
| `0007_tighten_personnel_profile_rls.sql` | Uygulandı | Personnel scoping |
| `0008_hr_fleet_operations_fields.sql` | Uygulandı | Fleet/HR columns |
| `0009_finance_core_missing_tables.sql` | Uygulandı | Finance tables |
| `0010_schema_compatibility_for_app_crud.sql` | Uygulandı | App CRUD column alignment |
| `0011_production_security_and_ops.sql` | Uygulandı | Anon revoke, staff RLS and audit append-only |
| `0012_auth_membership_onboarding.sql` | Uygulandı (`20260913211126`) | Auth and membership onboarding |
| `0013_personnel_documents_and_types.sql` | Uygulandı (`20260913213049`) | Personnel types and secure documents |
| `0014_payroll_partial_payments.sql` | Uygulandı (`20260913222011`) | Payroll partial payments |
| `0015_security_role_scope.sql` | Uygulandı (`20260913223712`) | Role-scoped security policies |
| `0016_founder_personnel_link.sql` | Uygulandı (`20260913225224`) | Founder/personnel linkage |
| `0017_profile_avatar.sql` | Uygulandı (`20260913230844`) | Profile avatar storage |
| `0018_notifications_audit_logs.sql` | Uygulandı (`20260913234456`) | Notifications and audit logs |
| `0019_public_card_rpc.sql` | Repo pending | Public personnel card RPC; verify before applying |
| `0020_accounting_planning.sql` | Repo pending | Bank/cash and payment planning foundation |
| `0021_exit_document_type.sql` | Repo pending | Exit-document type constraint |
| `0022_crane_telemetry.sql` | Repo pending | Crane GPS telemetry history and RLS |
| `0023_public_card_documents.sql` | Uygulandı (`public_card_documents`) | Safe public-card document metadata RPC; files remain private |
| `0024_payment_obligations.sql` | Uygulandı (`payment_obligations`) | Leasing, kredi, kart, petrol/DBS and tax payment installments |
| `0025_maintenance_expenses.sql` | Uygulandı (`expenses` genişletildi) | Servis, muayene, yağ bakımı, sayaç ve sonraki takip tarihi |
| `0026_delivery_notes.sql` | Uygulandı (`delivery_notes`) | Makbuzdan bağımsız irsaliye arşivi |

### Why the filenames changed

The repository previously contained duplicate numeric prefixes (`0012`, `0014`, and `0015`). The production migration history showed that the applied sequence after `0011` was onboarding, personnel documents, payroll partial payments, role scope, founder linkage, avatar, and notifications. Those applied migrations were assigned `0012` through `0018` in that exact order. The remaining repository migrations were assigned `0019` through `0022` in repository creation order and remain explicitly marked pending.

This was a **repository-only rename**. No SQL migration was re-run and no production schema or data was changed.

## Snapshot / verification record

Before renaming, production metadata was read from Supabase project `jimywfjufmrpgnjynhkx`:

- Migration history was read through Supabase `list_migrations`.
- Public schema table, column, RLS, row-count, and foreign-key metadata was captured through Supabase `list_tables(verbose=true)`.
- The project was `ACTIVE_HEALTHY` in `eu-central-1`.

The full tool output is retained in the session artifact store; this document records the verification point and intended ordering. For future destructive schema work, export a provider-level database backup in addition to this metadata snapshot.

## Future naming rule

The next new canonical migration must use **`0027_<purpose>.sql`**. Never reuse a numeric prefix, create letter suffixes, or rename an already applied migration without recording the production version mapping here.

## Deprecated

Everything under `supabase/migrations/` (dated experiments such as `20260912_*`, `20260913_*`, and `000_MINIMAL_*`) is archived intent and must not be applied to a clean project. The canonical ordered migrations live under `/migrations`.

## Verification SQL

```sql
SELECT c.relname, c.relrowsecurity AS rls_on, count(p.polname) AS policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public' AND c.relkind = 'r'
GROUP BY 1, 2 ORDER BY 1;
```

Expect `rls_on = true` and `policies >= 1` on business tables. Anonymous users must not be able to read business data.
