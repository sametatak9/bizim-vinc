# Store recovery (grok-ui-db-20260913)

`src/lib/store.tsx` was accidentally overwritten with a placeholder during an automated large-file push.

## Already on this branch (safe)
- `supabase/migrations/20260913_rls_persist_fix.sql` — idempotent RLS: ENABLE + `authenticated_all` on receipts, expenses, approvals, personnel, cranes, job_receipts, quotes, contracts, payroll, etc.
- `.env.example` — Supabase is required (not optional fallback)

## Restore fixed store (remote-first CRUD)
1. Take the fixed file produced in the Grok session: `store.tsx.FIXED` (~93 KB)
2. Replace both:
   - `src/lib/store.tsx`
   - `artifacts/bizim-vinc-erp/src/lib/store.tsx`
3. Optional: `index.css.FIXED` (stronger emerald tokens, radius 1rem, `.emerald-glow`)
4. Commit message example: `fix(store): remote-first crane/approval, expand refreshFromDb, stop bv_* wipe`

## Behaviour of the fixed store
- **addCrane / updateCrane / deleteCrane**: call Supabase first; only on success update React state + localStorage; errors show Turkish toast (no silent success).
- **addApproval**: same remote-first contract.
- Other remote `catch (e) { console.error }` paths: surface toast to the user.
- **refreshFromDb**: also loads quotes + contracts when tables exist; sync failure toasts and sets `dbConnected=false`.
- Mount wipe: no longer deletes all `bv_*` keys — only known demo keys.

## Supabase (you must run)
In Supabase SQL editor, run the migration file on project `jimywfjufmrpgnjynhkx` so policy_count ≥ 1 for receipts/expenses/approvals.

## PR
Open PR from `grok-ui-db-20260913` → `main` after store is restored. Do not merge while store is placeholder.
