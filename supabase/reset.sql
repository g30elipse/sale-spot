-- Dev reset: wipe all Bytes POS data and re-init the schema from scratch.
-- Paste into the Supabase SQL editor and run as one script.
-- Sign-in is mandatory, so this also clears the retired anonymous users.

drop table if exists public.orders, public.items, public.settings, public.stores cascade;
delete from auth.users where is_anonymous;

-- Bytes POS — Phase 2 schema.
-- Every table carries store_id; RLS scopes all access to stores owned by the
-- authenticated user. Sign-in is mandatory (email + 6-digit code) and each
-- account owns exactly one store — see the unique(owner) constraint migration.
-- IDs are client-generated (offline-first: the device can't wait for the server).

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default 'My café',
  created_at timestamptz not null default now()
);

create table public.items (
  store_id uuid not null references public.stores (id) on delete cascade,
  id text not null, -- client slug, e.g. 'flat-white'
  name text not null,
  cat text not null,
  price integer not null check (price >= 0), -- minor units, tax-inclusive
  mods text[] not null default '{}',
  sold_out boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (store_id, id)
);

create table public.orders (
  id uuid primary key, -- client-generated
  store_id uuid not null references public.stores (id) on delete cascade,
  no integer not null, -- per-device human-friendly counter
  created_at timestamptz not null,
  lines jsonb not null, -- [{id, name, mods, qty, unit}] snapshots
  tender text not null check (tender in ('Cash', 'Card')),
  tendered integer, -- cash given, null for card
  tax_rate numeric not null, -- snapshot at sale time
  voided boolean not null default false,
  synced_at timestamptz not null default now()
);

create index orders_store_day on public.orders (store_id, created_at desc);

create table public.settings (
  store_id uuid primary key references public.stores (id) on delete cascade,
  data jsonb not null, -- the app's Settings object verbatim
  updated_at timestamptz not null default now()
);

alter table public.stores enable row level security;
alter table public.items enable row level security;
alter table public.orders enable row level security;
alter table public.settings enable row level security;

create policy "own stores" on public.stores
  for all using (owner = auth.uid()) with check (owner = auth.uid());

create policy "own items" on public.items
  for all
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner = auth.uid()))
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner = auth.uid()));

create policy "own orders" on public.orders
  for all
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner = auth.uid()))
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner = auth.uid()));

create policy "own settings" on public.settings
  for all
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner = auth.uid()))
  with check (exists (select 1 from public.stores s where s.id = store_id and s.owner = auth.uid()));

-- One store per owner (single-store accounts until multi-location exists).
-- The upsert-style client select-then-insert can race; this makes the DB the referee.
alter table public.stores add constraint stores_owner_unique unique (owner);
