# Bizim Vinç ERP

Türk vinç kiralama operasyonlarını; personel, saha görevleri, filo durumu ve onay akışları üzerinden yöneten operasyon merkezi.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- `pnpm --filter @workspace/bizim-vinc-erp run typecheck` — check the dashboard web app
- `pnpm --filter @workspace/bizim-vinc-erp run build` — build the dashboard for publishing

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/bizim-vinc-erp/` — first web surface, currently the Turkish operations dashboard
- `supabase/migrations/` — imported Bizim Vinç schema sources, ordered 001 → 002 → 003
- `docs/plans/` — product brief, merged planning notes, and operations flows
- `lib/api-spec/openapi.yaml` — shared API contract source of truth when backend endpoints are added

## Architecture decisions

- The first delivery is a dashboard-first demonstration so the business can review the product before the full ERP surface is implemented.
- The existing GitHub repository is treated as the source repository; this workspace owns the web artifact and keeps the uploaded migration sources in version control.
- Supabase migrations remain separate from the Replit database schema until the product’s external Supabase connection and RLS policies are explicitly wired into application routes.

## Product

The product plan covers Turkish UI, role-based membership approval, site-scoped operations, personnel and digital cards, fleet and maintenance, quotes/contracts, attendance approvals, audit history, KVKK controls, and accounting exports. The first visible slice is the manager-facing Dashboard.

## User preferences

- User wants a shareable first tab and link quickly so the project can be presented to the employer before the full ERP is complete.

## Gotchas

- The uploaded SQL is a planning baseline, not a production-ready migration: RLS, storage policies, HMAC membership flow, and repeatable type/constraint guards still need an implementation pass.
- Do not expose health documents, adli sicil details, or plaintext Turkish identity numbers through the public personnel card.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
