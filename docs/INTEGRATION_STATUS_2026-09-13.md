# Integration status — 2026-09-13

- GitHub repository: https://github.com/sametatak9/bizim-vinc
- Working branch: `ai-studio-tur-20260913`
- Vercel project: `bizim-vinc`, linked to GitHub `sametatak9/bizim-vinc`
- Latest preview: https://bizim-vinc-ms9lzrcau-sametatak9s-projects.vercel.app
- Latest preview deployment state: READY
- Supabase project: `bizim-vinc`, ref `jimywfjufmrpgnjynhkx`, region `eu-central-1`, status `ACTIVE_HEALTHY`
- Vercel production environment variables added: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (values intentionally not stored here).
- Commits on branch:
  - `2a9d7bf feat(auth): enforce authenticated ERP access`
  - `abf91f4 feat(security): add approval-aware auth and ops schema`
- Supabase migration `security_ops_foundation` applied successfully.
- Pre/post row counts for existing public tables: profiles 0→0; personnel 3→3; approvals 0→0; approval_requests 0→0; cranes 3→3; receipts 0→0; expenses 0→0.
- Founder Auth user created for `sametatak9@gmail.com`; email confirmation completed; profile row linked with role `founder`, status `aktif`.
- Temporary founder password was generated only for setup/testing and was not stored in this file or repository. It must be changed by the user after first login.
