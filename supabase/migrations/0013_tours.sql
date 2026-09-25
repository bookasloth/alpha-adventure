-- Tour packages table so /tour-packages (+ detail) read from Supabase instead
-- of the static src/data/tours.js. Money is bigint paise (consistent with
-- treks/bookings). Public reads published, non-deleted; writes = service role.
create table if not exists tours (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  type        text,                       -- 'Domestic' | 'International'
  duration    text,                       -- e.g. "6D/5N"
  base_price  bigint not null default 0,  -- paise
  image       text,
  description text,
  featured    boolean not null default false,
  sort        smallint not null default 0,
  status      content_status not null default 'published',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists idx_tours_status on tours (status);

alter table tours enable row level security;

drop policy if exists tours_public_read on tours;
create policy tours_public_read on tours for select
  using (status = 'published' and deleted_at is null);

drop policy if exists tours_staff on tours;
create policy tours_staff on tours for all using (is_staff()) with check (is_staff());
