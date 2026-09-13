# Paste into Replit Agent (FULL MERGED PLAN v1.4)

Build GREENFIELD **Bizim Vinç** — Turkish crane rental & personnel ERP.

## Brand & UI
- Slogan: En derinden, en yükseklere
- Colors: #22C55E #15803D #DCFCE7 #F0FDF4 #FFFFFF #14532D #64748B #E2E8F0 #EF4444 #F59E0B
- Light theme, Inter/Geist, glass modals, holographic digital card
- TOP nav (no left sidebar): Dashboard · Personel · Onay · Filo · Finans · TV · Admin · Ayarlar
- Dashboard Mobofis-like: KPIs, avatar activity feed, pending tabs
- **operator/yardimci:** NO top nav — after login go to **Operatör Ekranı** only (shift, crane assignment, pre-use checklist, own attendance/leave, own digital card). Enforce with route guard + RLS (not just hide UI).
- Turkish UI throughout. Canva refs: logo DAHU-C2zjMA, mockups DAHU-Y6VAIg (recreate in code).

## Stack
Next.js App Router + TS + Tailwind + shadcn + Supabase (Auth/RLS/Storage) + Leaflet + Zod. .env.example + Turkish README. Deploy on Replit (Vercel-ready optional).

## Core rule
ALL official writes via Approval Center. **Membership signup is NOT an exception** — access also goes through approval.

## Auth & Membership (Step 1 MUST)
1. Register: email/phone + password + TC Kimlik No → store only `tc_hash` (HMAC-SHA256 server secret) on profiles + match personnel.tc_hash. `membership_status=pending_match`. User only sees “başvurunuz inceleniyor”.
2. Auto-match personnel by tc_hash → create `approval_requests(kind=uyelik_onay)` pending (never auto-approve). No match → admin can create/link personnel. If personnel already linked → flagged_duplicate.
3. Approve → link personnel_id, set role, membership_status=approved. Reject → rejected screen only.
4. Route guard: not approved → wait/reject screens only; operator/yardimci → Operatör Ekranı only; others → AppShell filtered by role + **site scope**.
5. `user_site_scopes(profile_id, site_id)`: yonetici/operasyon only see their sites’ approvals/data; admin global. UNIQUE one profile per personnel.

## KVKK (MUST)
- `personnel_consents` before collecting adli_sicil/health
- `health_documents` isolated table + strict RLS (not general documents)
- `data_retention_policies` + anonymize jobs (soft-delete alone insufficient)
- Public `/kart/[slug]`: only name, photo, doc STATUS — never adli/health details; high-entropy slug
- README VERBIS warning

## Step 1 ship
Auth+membership, AppShell, Personnel+avatars, digital cards+compliance block, Approval Center (kinds include uyelik_onay) with SLA/escalation via approval_rules, attendance only after approve, mobile_sync client_id, Admin (users/roles/scopes, data health incl unmatched memberships, dedup/merge, append-only audit_logs), seed, README.

## Schema also create (apply uploaded SQL 001+002+003)
Fleet GPS/maintenance, sites/assignments (operator+oiler pools), quotes/contracts/outbound_messages/activity_events, rate cards, receipts→invoice, spare_parts_inventory, crane_insurance, lift_plans, accounting_export_batches, cranes.ownership owned|subcontracted, notifications, number_sequences, dedup/merge/admin_data_issues.

## Integrity
Soft delete; unique employee_no/phone/tax_no/crane code/receipt_no/tc_hash/client_id; fuzzy name merge modal; strong FKs; RLS by role+site; audit_logs append-only (block UPDATE/DELETE).

## Ops flows
Assign operator+oiler from pool → gorevli + map company/location. Job start: email/WhatsApp card+contract e-sign. Job end: receipt+quote → approval → invoice. Operators = field terminals with photos.

## Done when
Build/run on Replit; membership→approval→role routing works; operator screen locked down; Personel/Kart/Onay/Admin usable with seed; Turkish UI; SQL migrations applied.
