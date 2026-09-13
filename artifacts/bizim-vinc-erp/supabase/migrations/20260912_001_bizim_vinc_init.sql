-- Bizim Vinç ERP — initial schema v1.2
-- Turkish crane rental & personnel ops
-- Apply in Supabase SQL editor or via CLI after project create

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ========== ENUMS ==========
create type app_role as enum (
  'admin', 'yonetici', 'muhasebe', 'operasyon',
  'operator', 'yardimci', 'idari'
);

create type personnel_kind as enum ('idari', 'operator', 'yardimci');
create type employment_status as enum ('aktif', 'izinli', 'pasif', 'merged');

create type document_type as enum (
  'adli_sicil', 'operator_belgesi', 'isg', 'myk', 'diger'
);

create type approval_kind as enum (
  'yoklama_geldi', 'mesai_kaldi', 'izin', 'makbuz',
  'yakit_masraf', 'vinc_hareket', 'avans', 'odeme',
  'tahsilat', 'preuse_checklist', 'diger'
);

create type approval_status as enum (
  'pending', 'approved', 'rejected', 'cancelled'
);

create type attendance_mark as enum (
  'geldi', 'gelmedi', 'mesaide', 'izinli', 'rapor'
);

create type cert_owner_type as enum ('personnel', 'crane');
create type cert_status as enum ('valid', 'expiring_soon', 'expired');

create type crane_status as enum (
  'musait', 'sahada', 'bakimda', 'arizali', 'pasif'
);

create type telemetry_provider as enum ('manual', 'nav_api', 'other');

create type maintenance_wo_status as enum (
  'open', 'in_progress', 'done', 'overdue', 'cancelled'
);

create type dedup_status as enum (
  'open', 'merged', 'dismissed', 'kept_separate'
);

create type issue_severity as enum ('info', 'warn', 'critical');

-- ========== PROFILES ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role app_role not null default 'operator',
  personnel_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ========== PERSONNEL ==========
create table public.personnel (
  id uuid primary key default gen_random_uuid(),
  employee_no text not null,
  full_name text not null,
  full_name_normalized text generated always as (
    lower(unaccent(trim(full_name)))
  ) stored,
  phone text,
  phone_e164 text,
  kind personnel_kind not null,
  status employment_status not null default 'aktif',
  title text,
  supervisor_personnel_id uuid references public.personnel(id),
  photo_url text,
  hired_at date,
  notes text,
  merged_into_id uuid references public.personnel(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index personnel_employee_no_alive_uidx
  on public.personnel (employee_no)
  where deleted_at is null and merged_into_id is null;

create unique index personnel_phone_alive_uidx
  on public.personnel (phone_e164)
  where deleted_at is null and merged_into_id is null and phone_e164 is not null;

create index personnel_name_trgm_idx
  on public.personnel using gin (full_name_normalized gin_trgm_ops);

alter table public.profiles
  add constraint profiles_personnel_fk
  foreign key (personnel_id) references public.personnel(id);

-- ========== CARDS & DOCUMENTS ==========
create table public.personnel_cards (
  id uuid primary key default gen_random_uuid(),
  personnel_id uuid not null unique references public.personnel(id) on delete cascade,
  public_slug text not null,
  hologram_theme text not null default 'bizim-vinc-green',
  is_public boolean not null default true,
  access_blocked boolean not null default false,
  block_reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index personnel_cards_slug_alive_uidx
  on public.personnel_cards (public_slug)
  where deleted_at is null;

create table public.personnel_documents (
  id uuid primary key default gen_random_uuid(),
  personnel_id uuid not null references public.personnel(id) on delete cascade,
  doc_type document_type not null,
  title text not null,
  storage_path text not null,
  visible_on_card boolean not null default true,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ========== COMPLIANCE ==========
create table public.compliance_certificates (
  id uuid primary key default gen_random_uuid(),
  owner_type cert_owner_type not null,
  owner_id uuid not null,
  cert_type text not null,
  title text,
  issued_at date,
  expires_at date not null,
  status cert_status not null default 'valid',
  storage_path text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index compliance_certs_owner_idx
  on public.compliance_certificates (owner_type, owner_id)
  where deleted_at is null;

create index compliance_certs_expires_idx
  on public.compliance_certificates (expires_at)
  where deleted_at is null;

-- ========== APPROVAL CENTER ==========
create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  kind approval_kind not null,
  status approval_status not null default 'pending',
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  requested_by uuid references public.profiles(id),
  personnel_id uuid references public.personnel(id),
  related_entity_type text,
  related_entity_id uuid,
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index approval_requests_pending_idx
  on public.approval_requests (created_at desc)
  where status = 'pending' and deleted_at is null;

-- ========== ATTENDANCE (official only after approval) ==========
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  personnel_id uuid not null references public.personnel(id),
  work_date date not null,
  mark attendance_mark not null,
  source_approval_id uuid references public.approval_requests(id),
  marked_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (personnel_id, work_date, mark)
);

-- ========== MOBILE SYNC / OFFLINE OUTBOX ==========
create table public.mobile_sync_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  profile_id uuid references public.profiles(id),
  kind approval_kind not null,
  payload jsonb not null default '{}'::jsonb,
  media_paths text[] not null default '{}',
  approval_request_id uuid references public.approval_requests(id),
  synced_at timestamptz not null default now()
);

-- ========== SITES / JOBS / ASSIGNMENTS ==========
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_normalized text generated always as (
    lower(unaccent(trim(name)))
  ) stored,
  tax_no text,
  phone text,
  email text,
  merged_into_id uuid references public.customers(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index customers_tax_no_alive_uidx
  on public.customers (tax_no)
  where deleted_at is null and merged_into_id is null and tax_no is not null;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  code text,
  title text not null,
  customer_id uuid references public.customers(id),
  site_id uuid references public.sites(id),
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ========== FLEET ==========
create table public.cranes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  plate text,
  name text,
  crane_class text,
  tonnage numeric,
  status crane_status not null default 'musait',
  telemetry_provider telemetry_provider not null default 'manual',
  merged_into_id uuid references public.cranes(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index cranes_code_alive_uidx
  on public.cranes (code)
  where deleted_at is null and merged_into_id is null;

create unique index cranes_plate_alive_uidx
  on public.cranes (plate)
  where deleted_at is null and merged_into_id is null and plate is not null;

create table public.crane_meters (
  id uuid primary key default gen_random_uuid(),
  crane_id uuid not null references public.cranes(id),
  engine_hours numeric,
  lift_count integer,
  recorded_at timestamptz not null default now(),
  source text not null default 'manual',
  created_by uuid references public.profiles(id)
);

create table public.crane_positions (
  id uuid primary key default gen_random_uuid(),
  crane_id uuid not null references public.cranes(id),
  lat double precision not null,
  lng double precision not null,
  heading double precision,
  speed double precision,
  recorded_at timestamptz not null default now(),
  raw jsonb not null default '{}'::jsonb
);

create index crane_positions_crane_time_idx
  on public.crane_positions (crane_id, recorded_at desc);

create table public.crane_assignments (
  id uuid primary key default gen_random_uuid(),
  crane_id uuid not null references public.cranes(id),
  personnel_id uuid references public.personnel(id),
  helper_personnel_id uuid references public.personnel(id),
  customer_id uuid references public.customers(id),
  site_id uuid references public.sites(id),
  job_id uuid references public.jobs(id),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.accessories (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  kind text not null,
  crane_id uuid references public.cranes(id),
  status text not null default 'available',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ========== MAINTENANCE ==========
create table public.maintenance_rules (
  id uuid primary key default gen_random_uuid(),
  crane_id uuid references public.cranes(id),
  crane_class text,
  title text not null,
  trigger_hours numeric,
  trigger_lifts integer,
  trigger_days integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (trigger_hours is not null or trigger_lifts is not null or trigger_days is not null)
);

create table public.maintenance_work_orders (
  id uuid primary key default gen_random_uuid(),
  crane_id uuid not null references public.cranes(id),
  rule_id uuid references public.maintenance_rules(id),
  title text not null,
  due_at timestamptz,
  due_hours numeric,
  due_lifts integer,
  status maintenance_wo_status not null default 'open',
  ndt_result text,
  wire_rope_changed_at date,
  notes text,
  completed_at timestamptz,
  source_approval_id uuid references public.approval_requests(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ========== FINANCE ==========
create table public.rate_cards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  crane_class text,
  tonnage numeric,
  boom_class text,
  unit text not null check (unit in ('hour', 'day', 'week')),
  unit_price numeric not null,
  overtime_mult numeric not null default 1.5,
  mobilization_fee numeric not null default 0,
  demobilization_fee numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.number_sequences (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null,
  year integer not null,
  prefix text not null default '',
  next_value integer not null default 1,
  unique (doc_type, year)
);

create table public.job_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null,
  customer_id uuid references public.customers(id),
  crane_id uuid references public.cranes(id),
  operator_personnel_id uuid references public.personnel(id),
  assignment_id uuid references public.crane_assignments(id),
  work_date date,
  subtotal numeric not null default 0,
  total numeric not null default 0,
  invoiced boolean not null default false,
  source_approval_id uuid references public.approval_requests(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index job_receipts_no_alive_uidx
  on public.job_receipts (receipt_no)
  where deleted_at is null;

create table public.job_receipt_lines (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.job_receipts(id) on delete cascade,
  rate_card_id uuid references public.rate_cards(id),
  line_type text not null,
  description text,
  qty numeric not null default 1,
  unit_price numeric not null default 0,
  amount numeric not null default 0
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null,
  customer_id uuid references public.customers(id),
  total numeric not null default 0,
  status text not null default 'draft',
  source_approval_id uuid references public.approval_requests(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.payment_plans (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  title text not null,
  total numeric not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.collection_plans (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  title text not null,
  total numeric not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  crane_id uuid references public.cranes(id),
  personnel_id uuid references public.personnel(id),
  kind text not null default 'yakit',
  amount numeric not null,
  expense_date date not null default current_date,
  source_approval_id uuid references public.approval_requests(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ========== NOTIFICATIONS / TV ==========
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  body text,
  related_approval_id uuid references public.approval_requests(id),
  audience_role app_role,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ========== ADMIN: DEDUP / MERGE / AUDIT / ISSUES ==========
create table public.dedup_candidates (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  a_id uuid not null,
  b_id uuid not null,
  score numeric not null,
  status dedup_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id)
);

create table public.merge_operations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  surviving_id uuid not null,
  absorbed_ids uuid[] not null,
  mapping jsonb not null default '{}'::jsonb,
  performed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);

create table public.admin_data_issues (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  severity issue_severity not null default 'warn',
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ========== HELPERS ==========
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger personnel_updated_at before update on public.personnel
  for each row execute function public.set_updated_at();
create trigger cranes_updated_at before update on public.cranes
  for each row execute function public.set_updated_at();

-- Official attendance ONLY via approved approval (enforce in app + optional RPC)
create or replace function public.apply_attendance_from_approval(p_approval_id uuid, p_actor uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  r public.approval_requests%rowtype;
  new_id uuid;
  v_date date;
  v_mark attendance_mark;
begin
  select * into r from public.approval_requests where id = p_approval_id for update;
  if r.status <> 'approved' then
    raise exception 'Approval not approved';
  end if;
  if r.kind not in ('yoklama_geldi', 'mesai_kaldi') then
    raise exception 'Wrong approval kind for attendance';
  end if;
  v_date := coalesce((r.payload->>'work_date')::date, (r.created_at at time zone 'Europe/Istanbul')::date);
  v_mark := case when r.kind = 'yoklama_geldi' then 'geldi'::attendance_mark else 'mesaide'::attendance_mark end;
  insert into public.attendance_records (personnel_id, work_date, mark, source_approval_id, marked_by)
  values (r.personnel_id, v_date, v_mark, r.id, p_actor)
  on conflict (personnel_id, work_date, mark) do update
    set source_approval_id = excluded.source_approval_id
  returning id into new_id;
  return new_id;
end;
$$;

-- Block public card when personnel has expired certs
create or replace function public.refresh_card_access(p_personnel_id uuid)
returns void language plpgsql security definer as $$
declare
  has_expired boolean;
begin
  select exists (
    select 1 from public.compliance_certificates c
    where c.owner_type = 'personnel'
      and c.owner_id = p_personnel_id
      and c.deleted_at is null
      and c.expires_at < current_date
  ) into has_expired;

  update public.personnel_cards
  set access_blocked = has_expired,
      block_reason = case when has_expired then 'Süresi dolmuş belge' else null end,
      updated_at = now()
  where personnel_id = p_personnel_id;
end;
$$;

comment on table public.approval_requests is 'Central gate: no official ops write without approve';
comment on table public.attendance_records is 'Only via apply_attendance_from_approval after approve';
comment on table public.crane_positions is 'Provider-agnostic GPS; nav_api adapter later';
