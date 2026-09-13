-- ============================================================================
-- BİZİM VİNÇ — MİNİMAL ŞEMA (tek seferde çalıştır)
-- Supabase Dashboard → SQL Editor → New query → Yapıştır → Run
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'operator',
  phone text,
  created_at timestamptz default now()
);

create table if not exists public.personnel (
  id uuid primary key default gen_random_uuid(),
  employee_no text unique not null,
  full_name text not null,
  phone text,
  kind text not null default 'operator',
  status text not null default 'aktif',
  pool_status text not null default 'havuzda',
  title text,
  documents_ok boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cranes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  crane_type text not null,
  status text not null default 'musait',
  capacity text,
  lat double precision,
  lng double precision,
  operator_id uuid references public.personnel(id),
  site_label text,
  last_service date,
  created_at timestamptz default now()
);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  status text not null default 'pending',
  title text not null,
  person_id uuid references public.personnel(id),
  person_name text,
  related_label text,
  note text,
  decision_note text,
  created_at timestamptz default now(),
  decided_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.personnel enable row level security;
alter table public.cranes enable row level security;
alter table public.approval_requests enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated using (true);

drop policy if exists "personnel_all" on public.personnel;
create policy "personnel_all" on public.personnel for all to authenticated using (true) with check (true);

drop policy if exists "cranes_all" on public.cranes;
create policy "cranes_all" on public.cranes for all to authenticated using (true) with check (true);

drop policy if exists "approvals_all" on public.approval_requests;
create policy "approvals_all" on public.approval_requests for all to authenticated using (true) with check (true);

insert into public.personnel (employee_no, full_name, kind, status, pool_status, title, phone)
values
  ('P001', 'Mehmet Kaya', 'operator', 'aktif', 'gorevli', 'Operatör', '0532 111 2233'),
  ('P002', 'Ali Demir', 'operator', 'aktif', 'gorevli', 'Operatör', '0533 222 3344'),
  ('P003', 'Elif Yılmaz', 'operator', 'aktif', 'havuzda', 'Platform operatörü', '0534 333 4455')
on conflict (employee_no) do nothing;

insert into public.cranes (code, crane_type, status, capacity, lat, lng, site_label)
values
  ('V-204', 'Mobil Vinç', 'sahada', '50 ton', 40.9923, 29.1244, 'Ataşehir'),
  ('V-118', 'Teleskopik', 'sahada', '80 ton', 40.3522, 27.9767, 'Bandırma'),
  ('V-302', 'Sepetli', 'musait', '22 m', 41.0255, 29.1695, 'Çekmeköy')
on conflict (code) do nothing;

select 'OK — personnel: ' || count(*)::text from public.personnel;
