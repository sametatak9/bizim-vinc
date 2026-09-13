# Bizim Vinç — implementation notes

The imported SQL and product prompts describe a strong ERP direction. They are kept as planning sources and will be hardened before real company data is connected.

## First delivery

- Deliver one employer-facing screen first: the Turkish operations dashboard.
- Keep the planned top navigation visible so the product direction is clear without pretending the other modules are complete.
- Use clearly labeled demo data until the Supabase schema and policies are applied.

## Before production data

1. Add and verify Row Level Security policies for every business table.
2. Add Storage policies for personnel documents, cards, insurance, and isolated health documents.
3. Make enum creation and named constraints safe for repeatable migrations.
4. Implement server-side HMAC-SHA256 for `tc_hash`; never store plaintext identity numbers.
5. Enforce the membership approval gate and site scopes in both route guards and database policies.
6. Keep the public personnel card minimal: name, photo, and document status only.
7. Enforce append-only audit logs and route official operational writes through approvals.

## Migration order

Apply the imported sources in order:

1. `20260912_001_bizim_vinc_init.sql`
2. `20260912_002_ops_contracts_quotes.sql`
3. `20260912_003_claude_enhancements.sql`

These files are not applied automatically by the first visual demo.