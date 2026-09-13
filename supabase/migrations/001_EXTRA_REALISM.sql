-- ============================================================================
-- BİZİM VİNÇ — EK ŞEMA (personel evrak + üyelik + operatör talepleri)
-- Mevcut: profiles, personnel, cranes, approval_requests
-- SQL Editor → New query → Run
-- ============================================================================

create table if not exists public.personnel_documents (
  id uuid primary key default gen_random_uuid(),
  personnel_id uuid not null references public.personnel(id) on delete cascade,
  doc_type text not null,
  title text not null,
  file_url text,
  expires_at date,
  status text not null default 'gecerli',
  notes text,
  uploaded_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_personnel_documents_person on public.personnel_documents(personnel_id);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  personnel_id uuid references public.personnel(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  role text not null default 'operator',
  status text not null default 'aktif',
  permissions jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_memberships_personnel on public.memberships(personnel_id);

create table if not exists public.operator_requests (
  id uuid primary key default gen_random_uuid(),
  personnel_id uuid references public.personnel(id) on delete set null,
  membership_id uuid references public.memberships(id) on delete set null,
  kind text not null,
  title text not null,
  body text,
  amount numeric(12,2),
  status text not null default 'pending',
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  decided_at timestamptz
);

create index if not exists idx_operator_requests_status on public.operator_requests(status);

create table if not exists public.digital_cards (
  id uuid primary key default gen_random_uuid(),
  personnel_id uuid not null references public.personnel(id) on delete cascade,
  public_token text unique not null,
  is_active boolean default true,
  show_phone boolean default true,
  show_docs boolean default true,
  created_at timestamptz default now()
);

alter table public.personnel_documents enable row level security;
alter table public.memberships enable row level security;
alter table public.operator_requests enable row level security;
alter table public.digital_cards enable row level security;

drop policy if exists "personnel_documents_all" on public.personnel_documents;
create policy "personnel_documents_all" on public.personnel_documents for all to authenticated using (true) with check (true);

drop policy if exists "memberships_all" on public.memberships;
create policy "memberships_all" on public.memberships for all to authenticated using (true) with check (true);

drop policy if exists "operator_requests_all" on public.operator_requests;
create policy "operator_requests_all" on public.operator_requests for all to authenticated using (true) with check (true);

drop policy if exists "digital_cards_all" on public.digital_cards;
create policy "digital_cards_all" on public.digital_cards for all to authenticated using (true) with check (true);

drop policy if exists "digital_cards_public_read" on public.digital_cards;
create policy "digital_cards_public_read" on public.digital_cards for select to anon using (is_active = true);

select 'OK — ekstra tablolar hazır' as result;
