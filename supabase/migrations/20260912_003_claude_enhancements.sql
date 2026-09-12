-- Bizim Vinç v1.4 — Claude plan merges: membership, KVKK, scopes, SLA, insurance, spare parts

create type membership_status as enum (
  'pending_match', 'pending_approval', 'approved', 'rejected', 'inactive'
);

-- Extend approval kinds via check isn't easy on enum — add new values
alter type approval_kind add value if not exists 'uyelik_onay';

alter table public.profiles
  add column if not exists tc_hash text,
  add column if not exists membership_status membership_status not null default 'pending_match';

alter table public.personnel
  add column if not exists tc_hash text,
  add column if not exists role app_role;

create unique index if not exists profiles_personnel_unique_alive
  on public.profiles (personnel_id)
  where personnel_id is not null and deleted_at is null;

create unique index if not exists personnel_tc_hash_alive_uidx
  on public.personnel (tc_hash)
  where deleted_at is null and tc_hash is not null;

create unique index if not exists profiles_tc_hash_alive_uidx
  on public.profiles (tc_hash)
  where deleted_at is null and tc_hash is not null;

-- Site scopes for yonetici/operasyon
create table if not exists public.user_site_scopes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, site_id)
);

-- Approval rules + SLA escalation
create table if not exists public.approval_rules (
  id uuid primary key default gen_random_uuid(),
  kind approval_kind not null unique,
  sla_hours integer not null default 24,
  escalate_to_role app_role,
  delegate_approver_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.approval_requests
  add column if not exists site_id uuid references public.sites(id),
  add column if not exists flagged_duplicate boolean not null default false,
  add column if not exists escalated_at timestamptz,
  add column if not exists sla_due_at timestamptz;

-- KVKK consents
create table if not exists public.personnel_consents (
  id uuid primary key default gen_random_uuid(),
  personnel_id uuid not null references public.personnel(id),
  consent_type text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  text_version text not null,
  created_at timestamptz not null default now()
);

-- Health docs isolated
create table if not exists public.health_documents (
  id uuid primary key default gen_random_uuid(),
  personnel_id uuid not null references public.personnel(id),
  title text not null,
  storage_path text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.data_retention_policies (
  id uuid primary key default gen_random_uuid(),
  data_category text not null unique,
  retention_years integer not null,
  auto_action text not null default 'anonymize',
  created_at timestamptz not null default now()
);

-- Fleet extras
alter table public.cranes
  add column if not exists ownership text not null default 'owned'
    check (ownership in ('owned', 'subcontracted'));

create table if not exists public.crane_insurance (
  id uuid primary key default gen_random_uuid(),
  crane_id uuid not null references public.cranes(id),
  policy_type text not null,
  insurer text,
  policy_no text,
  expires_at date not null,
  storage_path text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.spare_parts_inventory (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  name text not null,
  qty numeric not null default 0,
  unit text not null default 'adet',
  min_qty numeric not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.lift_plans (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.crane_assignments(id),
  crane_id uuid references public.cranes(id),
  boom_length numeric,
  angle_deg numeric,
  radius_m numeric,
  load_kg numeric,
  capacity_kg numeric,
  notes text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.accounting_export_batches (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  exported_at timestamptz
);

-- Append-only audit: block update/delete
create or replace function public.prevent_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_logs is append-only';
end;
$$;

drop trigger if exists audit_logs_no_update on public.audit_logs;
drop trigger if exists audit_logs_no_delete on public.audit_logs;
create trigger audit_logs_no_update before update on public.audit_logs
  for each row execute function public.prevent_audit_mutation();
create trigger audit_logs_no_delete before delete on public.audit_logs
  for each row execute function public.prevent_audit_mutation();

comment on column public.profiles.tc_hash is 'HMAC-SHA256 of TC; never store plaintext TC';
comment on table public.health_documents is 'KVKK isolated health docs; strict RLS (isyerı hekimi/admin)';
