-- Bizim Vinç v1.3 — ops pools, contracts, quotes, dispatch messaging

create type pool_status as enum ('havuzda', 'gorevli', 'izinli', 'pasif');
create type contract_status as enum (
  'draft', 'sent', 'viewed', 'signed', 'rejected', 'expired', 'cancelled'
);
create type quote_status as enum (
  'draft', 'sent', 'accepted', 'rejected', 'converted', 'cancelled'
);
create type message_channel as enum ('email', 'whatsapp', 'sms', 'push');

-- Operator/oiler availability pools (derived + explicit)
alter table public.personnel
  add column if not exists pool_status pool_status not null default 'havuzda',
  add column if not exists avatar_url text;

-- Enrich assignments for map + company context
alter table public.crane_assignments
  add column if not exists oiler_personnel_id uuid references public.personnel(id),
  add column if not exists company_name text,
  add column if not exists map_lat double precision,
  add column if not exists map_lng double precision,
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists quote_id uuid,
  add column if not exists contract_id uuid;

-- When assignment becomes active → personnel leave free pool
create or replace function public.on_assignment_activate()
returns trigger language plpgsql as $$
begin
  if new.status in ('active', 'sahada', 'gorevde') then
    update public.personnel
      set pool_status = 'gorevli', updated_at = now()
      where id in (new.personnel_id, new.oiler_personnel_id, new.helper_personnel_id)
        and id is not null;
    update public.cranes
      set status = 'sahada', updated_at = now()
      where id = new.crane_id;
  end if;
  if new.status in ('done', 'cancelled') and (old.status is distinct from new.status) then
    update public.personnel
      set pool_status = 'havuzda', updated_at = now()
      where id in (new.personnel_id, new.oiler_personnel_id, new.helper_personnel_id)
        and id is not null
        and not exists (
          select 1 from public.crane_assignments a
          where a.deleted_at is null
            and a.status in ('active', 'sahada', 'gorevde')
            and a.id <> new.id
            and (a.personnel_id = public.personnel.id
              or a.oiler_personnel_id = public.personnel.id
              or a.helper_personnel_id = public.personnel.id)
        );
  end if;
  return new;
end;
$$;

drop trigger if exists crane_assignments_pool_trg on public.crane_assignments;
create trigger crane_assignments_pool_trg
  after insert or update of status on public.crane_assignments
  for each row execute function public.on_assignment_activate();

-- Quotes (teklif)
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null,
  customer_id uuid references public.customers(id),
  site_id uuid references public.sites(id),
  crane_id uuid references public.cranes(id),
  title text not null,
  status quote_status not null default 'draft',
  subtotal numeric not null default 0,
  total numeric not null default 0,
  valid_until date,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists quotes_no_alive_uidx
  on public.quotes (quote_no) where deleted_at is null;

create table if not exists public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  rate_card_id uuid references public.rate_cards(id),
  description text,
  qty numeric not null default 1,
  unit_price numeric not null default 0,
  amount numeric not null default 0
);

-- Job start contracts (imzalı iş başlama sözleşmesi)
create table if not exists public.job_contracts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.crane_assignments(id),
  quote_id uuid references public.quotes(id),
  customer_id uuid references public.customers(id),
  personnel_card_id uuid references public.personnel_cards(id),
  status contract_status not null default 'draft',
  contract_pdf_path text,
  customer_signed_at timestamptz,
  company_signed_at timestamptz,
  customer_sign_meta jsonb,
  sent_via message_channel[],
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Outbound messages (email / WhatsApp)
create table if not exists public.outbound_messages (
  id uuid primary key default gen_random_uuid(),
  channel message_channel not null,
  to_address text not null,
  subject text,
  body text,
  related_type text,
  related_id uuid,
  status text not null default 'queued',
  provider_ref text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- Activity feed for Mobofis-like dashboard
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  personnel_id uuid references public.personnel(id),
  actor_profile_id uuid references public.profiles(id),
  event_type text not null,
  title text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_created_idx
  on public.activity_events (created_at desc);

-- Link receipt to quote (makbuz + teklif birleşik onay)
alter table public.job_receipts
  add column if not exists quote_id uuid references public.quotes(id),
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists location_text text,
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision;

alter table public.crane_assignments
  add constraint crane_assignments_quote_fk
  foreign key (quote_id) references public.quotes(id);

alter table public.crane_assignments
  add constraint crane_assignments_contract_fk
  foreign key (contract_id) references public.job_contracts(id);

comment on table public.quotes is 'Teklif; accepted quote links to assignment + receipt approval';
comment on table public.job_contracts is 'İş başı sözleşme; email/WhatsApp + e-sign';
comment on table public.activity_events is 'Dashboard hareketler feed';
