-- ============================================================
-- Migration 001 — Barista Cafe Bill Generator
-- ============================================================

-- ─── bills ────────────────────────────────────────────────
create table if not exists bills (
  id            text          primary key,                              -- e.g. BRST10234
  subtotal      numeric(10,2) not null,
  tax_rate      numeric(5,2)  not null default 5,
  tax_amount    numeric(10,2) not null,
  total_amount  numeric(10,2) not null,
  created_at    timestamptz   not null default now()
);

-- ─── bill_items ───────────────────────────────────────────
create table if not exists bill_items (
  id          uuid           primary key default gen_random_uuid(),
  bill_id     text           not null references bills(id) on delete cascade,
  item_name   text           not null,
  quantity    integer        not null check (quantity > 0),
  price       numeric(10,2)  not null,
  item_total  numeric(10,2)  not null
);

create index if not exists bill_items_bill_id_idx on bill_items(bill_id);

-- ─── Row Level Security ────────────────────────────────────
alter table bills      enable row level security;
alter table bill_items enable row level security;

-- Public can read any bill by ID (for QR web page)
create policy "public_read_bills"
  on bills for select
  using (true);

create policy "public_read_bill_items"
  on bill_items for select
  using (true);

-- Anon (staff app) can insert bills
create policy "anon_insert_bills"
  on bills for insert
  with check (true);

create policy "anon_insert_bill_items"
  on bill_items for insert
  with check (true);

-- ─── Bill ID counter helper ────────────────────────────────
-- We use a simple sequence to generate the numeric part of the bill ID.
create sequence if not exists bill_id_seq start 10001 increment 1;

-- Helper function: generate next bill ID → BRST10001, BRST10002 …
create or replace function next_bill_id()
returns text
language sql
as $$
  select 'BRST' || nextval('bill_id_seq')::text;
$$;
