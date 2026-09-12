# FAZ 0 raporu — Komuta Dashboard

Tarih: 2026-09-12

## Uygulanan migration’lar
- `0002_core.sql` — personnel, sites, customers, jobs, cranes, crane_positions, crane_assignments, approval_requests, audit_logs
- `0003_ops.sql` — rate_cards, number_sequences, quotes, contracts, job_receipts, expenses, fuel_logs, activity_events
- `0004_seed.sql` — İstanbul demo seed (idempotent, sabit UUID)

## Disiplin
Soft delete + partial UNIQUE. FK RESTRICT / SET NULL. approval_requests merkezi kapı. audit_logs append-only. TC plaintext yok.
